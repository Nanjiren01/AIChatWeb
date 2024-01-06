import { NextRequest, NextResponse } from "next/server";

import { RequestBody } from "./langchain";
import { getBaseUrl } from "../../common";

export interface RunEntity {
  id: number;
  uuid: string;
  assistantId: number;
  threadId: number;
  modelName: string;
  tools: string;
  instructions: string;
  thirdpartId: string;
  thirdpartInfo: string;
  status: string;
  creatorId: number;
  startTime: Date;
  expireTime: Date;
  cancelTime: Date;
  completeTime: Date;
  failTime: Date;
  createTime: Date;
  updateTime: Date;
}

export interface RunStepEntity {
  id: number;
  uuid: string;
  thirdpartId: string;
  thirdpartInfo: string;
}

export interface ThreadMessageEntity {
  id: number;
  uuid: string;
  thirdpartId: string;
  thirdpartInfo: string;
}

export async function handle(req: NextRequest, reqBody: RequestBody) {
  const transformStream = new TransformStream();
  const writer = transformStream.writable.getWriter();
  const encoder = new TextEncoder();

  // setTimeout(async () => {
  //   await query(writer, encoder);
  //   setTimeout(async () => {
  //     await writer.write(
  //       encoder.encode(`data: ${JSON.stringify({
  //         choices: [{
  //           delta: {
  //             content: '随便输出一点'
  //           }
  //         }]
  //       })}\n\n`),
  //     );
  //     await writer.write(
  //       encoder.encode(`data: [DONE]\n\n`),
  //     );
  //     await writer.close();
  //   }, 3000);
  // }, 3000);

  const assistantUuid = reqBody.assistantUuid!;
  const threadUuid = reqBody.threadUuid!;
  const lastMessage = reqBody.messages[reqBody.messages.length - 1];

  const authToken = req.headers.get("Authorization") ?? "";
  let baseUrl = getBaseUrl(req); // "https://api.openai.com/v1";
  const messageResp = await fetch(baseUrl + "/threadMessage", {
    method: "post",
    headers: {
      Authorization: authToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      threadUuid: threadUuid,
      role: "user",
      content: lastMessage.content,
    }),
  });
  if (!messageResp.ok) {
    console.log("添加message到thread失败：未知原因", messageResp.status);
    writeError(writer, encoder, "添加message到thread失败：未知原因");
    return new Response(transformStream.readable, {
      headers: { "Content-Type": "application/json" },
    });
  } else {
    const messageRespJson = await messageResp.json();
    if (messageRespJson.code !== 0) {
      console.log("添加message到thread失败：" + messageRespJson.message);
      writeError(writer, encoder, messageRespJson);
      return new Response(transformStream.readable, {
        headers: { "Content-Type": "application/json" },
      });
    }
    console.log("添加message到thread成功：" + messageRespJson.data);
    const runResp = await fetch(baseUrl + "/threadRun/" + threadUuid, {
      method: "post",
      headers: {
        Authorization: authToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistantUuid: assistantUuid,
        threadUuid: threadUuid,
      }),
    });
    const runRespJson = await runResp.json();
    if (runRespJson.code !== 0) {
      console.log("启动thread失败：" + messageRespJson.message);
      writeError(writer, encoder, runRespJson);
      return new Response(transformStream.readable, {
        headers: { "Content-Type": "application/json" },
      });
    }
    const runEntity = runRespJson.data as RunEntity;
    console.log("启动thread run成功！");
    setTimeout(async () => {
      // 前端收到此消息时，提示运行中
      const result = await output(
        writer,
        encoder,
        {
          type: "createRun",
          run: {
            id: runEntity.id,
            uuid: runEntity.uuid,
            status: runEntity.status,
            startTime: runEntity.startTime,
            expireTime: runEntity.expireTime,
            cancelTime: runEntity.cancelTime,
            completeTime: runEntity.completeTime,
            failTime: runEntity.failTime,
          },
        },
        false,
      );
      console.log("输出createRun成功");
      if (result === false) {
        return;
      }
      const globalMessageIds = new Set<string>();
      const setTimer = () =>
        setTimeout(async () => {
          const reuslt = await retrieveRun(
            baseUrl,
            authToken,
            threadUuid,
            runEntity,
            writer,
            encoder,
            globalMessageIds,
          );
          if (reuslt) {
            console.log("result is true, setTimeout 3000ms");
            setTimer();
          } else {
            await writer.close();
          }
        }, 3000);
      setTimer();
    }, 0);
  }

  return new Response(transformStream.readable, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

async function retrieveRun(
  baseUrl: string,
  authToken: string,
  threadUuid: string,
  runEntity: RunEntity,
  writer: WritableStreamDefaultWriter<any>,
  encoder: TextEncoder,
  globalMessageIds: Set<string>,
) {
  const runResp = await fetch(
    baseUrl + "/threadRun/retrieve/" + runEntity.uuid,
    {
      method: "get",
      headers: {
        Authorization: authToken,
        "Content-Type": "application/json",
      },
    },
  );
  const runRespJson = await runResp.json();
  if (runRespJson.code !== 0) {
    console.error("获取run状态失败：" + runRespJson.message);
    await output(
      writer,
      encoder,
      {
        type: "errorResp",
        resp: runRespJson,
      },
      true,
    );
    return false;
  }
  console.log("获取run状态成功");
  const newRun = runRespJson.data as RunEntity;

  const messageIds = new Set<string>();
  const retrieveRunStepsResult = await retrieveRunSteps(
    baseUrl,
    authToken,
    newRun,
    writer,
    encoder,
    messageIds,
  );
  if (false === retrieveRunStepsResult) {
    console.log("retrieveRunStepsResult === false");
    return false;
  }
  if (messageIds.size > 0) {
    const result = await retrieveMessages(
      baseUrl,
      authToken,
      threadUuid,
      writer,
      encoder,
      messageIds,
      globalMessageIds,
    );
    if (result === false) {
      return false;
    }
  }

  const result = await output(
    writer,
    encoder,
    {
      type: "updateRun",
      run: {
        id: newRun.id,
        uuid: newRun.uuid,
        status: newRun.status,
        startTime: newRun.startTime,
        expireTime: newRun.expireTime,
        cancelTime: newRun.cancelTime,
        completeTime: newRun.completeTime,
        failTime: newRun.failTime,
      },
    },
    false,
  );
  if (result === false) {
    return;
  }

  if (newRun.status === "completed") {
    console.log("run运行结束", newRun);
    await output(
      writer,
      encoder,
      {
        choices: [
          {
            delta: {
              content: "\n",
            },
          },
        ],
      },
      true,
    );
    return false;
  }
  return true;
}

async function retrieveRunSteps(
  baseUrl: string,
  authToken: string,
  runEntity: RunEntity,
  writer: WritableStreamDefaultWriter<any>,
  encoder: TextEncoder,
  messageIds: Set<string>,
) {
  const runResp = await fetch(
    baseUrl + "/threadRun/retrieve/" + runEntity.uuid + "/steps",
    {
      method: "get",
      headers: {
        Authorization: authToken,
        "Content-Type": "application/json",
      },
    },
  );
  const runStepsRespJson = await runResp.json();
  if (runStepsRespJson.code !== 0) {
    console.error("获取run steps失败：" + runStepsRespJson.message);
    await output(
      writer,
      encoder,
      {
        type: "errorResp",
        resp: runStepsRespJson,
      },
      true,
    );
    return false;
  }
  console.log("获取run steps成功");
  const runSteps = runStepsRespJson.data as RunStepEntity[];
  const outputResult = await output(
    writer,
    encoder,
    {
      type: "updateRunSteps",
      runSteps: runSteps,
    },
    false,
  );
  if (outputResult === false) {
    return false;
  }
  runSteps.filter((runStep) => {
    if (!runStep.thirdpartInfo) {
      return false;
    }
    const thirdpartInfo = JSON.parse(runStep.thirdpartInfo);
    if (thirdpartInfo.step_details?.type === "message_creation") {
      messageIds.add(thirdpartInfo.step_details!.message_creation.message_id);
    }
  });
  return true;
}

async function retrieveMessages(
  baseUrl: string,
  authToken: string,
  threadUuid: string,
  writer: WritableStreamDefaultWriter<any>,
  encoder: TextEncoder,
  messageIds: Set<string>,
  globalMessageIds: Set<string>,
) {
  const messageResp = await fetch(baseUrl + "/threadMessage/" + threadUuid, {
    method: "get",
    headers: {
      Authorization: authToken,
      "Content-Type": "application/json",
    },
  });
  const messageRespJson = await messageResp.json();
  if (messageRespJson.code !== 0) {
    console.error("获取thread messages失败：" + messageRespJson.message);
    await output(
      writer,
      encoder,
      {
        type: "errorResp",
        resp: messageRespJson,
      },
      true,
    );
    return false;
  }
  console.log("获取thread messages成功", JSON.stringify(messageIds));
  const messages = messageRespJson.data.filter(
    (m: any) =>
      messageIds.has(m.thirdpartId) && !globalMessageIds.has(m.thirdpartId),
  );
  messages.forEach((msg: any) => {
    globalMessageIds.add(msg.thirdpartId);
  });
  const outputResult = await output(
    writer,
    encoder,
    {
      type: "updateMessages",
      messages: messages,
    },
    false,
  );
  if (outputResult === false) {
    return false;
  }
  return true;
}

async function output(
  writer: WritableStreamDefaultWriter<any>,
  encoder: TextEncoder,
  content: any,
  finish: boolean,
) {
  try {
    await writer.write(encoder.encode(`data: ${JSON.stringify(content)}\n\n`));
    if (finish) {
      await writer.write(encoder.encode(`data: [DONE]\n\n`));
      await writer.close();
    }
    return true;
  } catch (e) {
    console.error("writer error", JSON.stringify(content), e);
    return false;
  }
}

async function writeError(
  writer: WritableStreamDefaultWriter<any>,
  encoder: TextEncoder,
  e: any,
) {
  await writer.ready;
  await writer.write(encoder.encode(JSON.stringify(e)));
  await writer.close();
}

async function test(
  writer: WritableStreamDefaultWriter<any>,
  encoder: TextEncoder,
) {
  await writer.ready;
  await writer.write(
    encoder.encode(
      `data: ${JSON.stringify({
        isToolMessage: true,
        isSuccess: true,
        toolName: "测试工具",
        message: "测试输出",
      })}\n\n`,
    ),
  );
}
