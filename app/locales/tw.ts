import { SubmitKey } from "../store/config";
import type { PartialLocaleType } from "./index";

const tw: PartialLocaleType = {
  WIP: "該功能仍在開發中……",
  Error: {
    Unauthorized: "目前您的狀態是未授權，請前往設定頁面輸入授權碼。",
  },
  Sidebar: {
    Title: "公告",
    Close: "关闭",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} 條對話`,
  },
  Chat: {
    SubTitle: (count: number) => `您已經與 ChatGPT 進行了 ${count} 條對話`,
    Actions: {
      ChatList: "查看訊息列表",
      CompressedHistory: "查看壓縮後的歷史 Prompt",
      Export: "匯出聊天紀錄",
      Copy: "複製",
      Stop: "停止",
      Retry: "重試",
      Delete: "刪除",
    },
    Rename: "重命名對話",
    Typing: "正在輸入…",
    SensitiveWordsTip: (question: string) =>
      `您的提问中包含敏感词：${question}`,
    BalanceNotEnough: "您的额度不足，请联系管理员",
    Input: (submitKey: string) => {
      var inputHints = `輸入訊息後，按下 ${submitKey} 鍵即可發送`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "，Shift + Enter 鍵換行";
      }
      return inputHints;
    },
    Send: "發送",
    Config: {
      Reset: "重置默认",
      SaveAs: "另存为面具",
    },
  },
  Export: {
    Title: "將聊天記錄匯出為 Markdown",
    Copy: "複製全部",
    Download: "下載檔案",
    MessageFromYou: "來自您的訊息",
    MessageFromChatGPT: "來自 ChatGPT 的訊息",
  },
  Memory: {
    Title: "上下文記憶 Prompt",
    EmptyContent: "尚未記憶",
    Copy: "複製全部",
    Send: "發送記憶",
    Reset: "重設對話",
    ResetConfirm: "重設後將清除目前對話記錄以及歷史記憶，確認重設？",
  },
  Home: {
    NewChat: "新的對話",
    DeleteChat: "確定要刪除選取的對話嗎？",
    DeleteToast: "已刪除對話",
    Revert: "撤銷",
    NoNotice: "暂无公告",
  },
  LoginPage: {
    Title: "登录",
    SubTitle: "登录后可跟AI交流",
    Username: {
      Title: "用户名",
      SubTitle: "",
      Placeholder: "请输入用户名",
    },
    Password: {
      Title: "密码",
      SubTitle: "",
      Placeholder: "请输入密码",
    },
    Actions: {
      Close: "关闭",
      Login: "登录",
      Logout: "退出登录",
    },
    Toast: {
      Success: "登录成功",
      Logining: "登录中……",
    },
    GoToRegister: "前往注册",
  },
  RegisterPage: {
    Title: "注册",
    SubTitle: "注册后赠送免费额度哦",
    Name: {
      Title: "昵称",
      SubTitle: "",
      Placeholder: "请输入昵称，可不填",
    },
    Email: {
      Title: "邮箱",
      SubTitle: "",
      Placeholder: "请输入邮箱",
    },
    EmailCode: {
      Title: "验证码",
      SubTitle: "系统将向您邮箱发送的验证码",
      Placeholder: "请输入验证码",
    },
    Username: {
      Title: "用户名",
      SubTitle: "",
      Placeholder: "请输入用户名",
    },
    Password: {
      Title: "密码",
      SubTitle: "",
      Placeholder: "请输入密码",
    },
    ConfirmedPassword: {
      Title: "确认密码",
      SubTitle: "",
      Placeholder: "请再次输入密码",
    },
    Actions: {
      Close: "关闭",
    },
    Toast: {
      Success: "注册成功，正在前往聊天……",
      Registering: "注册中……",
      Failed: "注册失败！",
      FailedWithReason: "注册失败！原因：",
      PasswordNotTheSame: "两次输入的密码不一致！",
      PasswordEmpty: "密码不能为空！",
      SendEmailCode: "发送验证码",
      EmailCodeSending: "验证码发送中",
      EmailCodeSent: "验证码已发送，请查看邮箱",
      EmailIsEmpty: "请输入邮箱",
      EmailCodeSentFrequently: "验证码发送过于频繁，请稍后再试",
      EmailFormatError: "邮箱格式不正确",
      EmailCodeEmpty: "请输入邮箱验证码",
      EmailExistsError: "该邮箱已注册",
    },
    GoToLogin: "前往登录",
    Captcha: "",
    CaptchaTitle: "点击刷新验证码",
    CaptchaIsEmpty: "请输入图形验证码",
    CaptchaLengthError: "图形验证码长度不正确",
    CaptchaInput: {
      Title: "图形验证码",
      SubTitle: "",
      Placeholder: "请输入图中的验证码",
    },
  },
  Profile: {
    Title: "个人中心",
    SubTitle: "个人中心",
    Username: "账号",
    Tokens: {
      Title: "tokens",
      SubTitle: "剩余tokens数量",
    },
    ChatCount: {
      Title: "询问次数",
      SubTitle: "剩余询问次数（GPT3.5等）",
    },
    AdvanceChatCount: {
      Title: "询问次数（GPT4）",
      SubTitle: "聊天询问次数（GPT4）",
    },
    DrawCount: {
      Title: "绘图次数",
      SubTitle: "剩余绘图次数",
    },
    Actions: {
      Close: "关闭",
      Pricing: "购买套餐",
      GoToBalanceList: "更多",
      ConsultAdministrator: "请咨询站长",
    },
    BalanceItem: {
      Title: "套餐类型",
      SubTitle: "",
      CalcTypes: {
        Total: "总额",
        Daily: "每天",
        Hourly: "每小时",
        ThreeHourly: "每3小时",
      },
    },
    ExpireList: {
      Title: "过期时间",
      SubTitle: "",
    },
  },
  PricingPage: {
    Title: "充值",
    SubTitle: "畅享与AI聊天的乐趣",
    Actions: {
      Close: "关闭",
      Buy: " 购 买 ",
    },
    NoPackage: "暂无可用套餐",
    ConsultAdministrator: "请咨询站长",
  },
  Settings: {
    Title: "設定",
    SubTitle: "設定選項",

    Lang: {
      Name: "Language", // ATTENTION: if you wanna add a new translation, please do not translate this value, leave it as `Language`
      All: "所有语言",
    },
    Avatar: "大頭貼",
    FontSize: {
      Title: "字型大小",
      SubTitle: "聊天內容的字型大小",
    },
    Update: {
      Version: (x: string) => `當前版本：${x}`,
      IsLatest: "已是最新版本",
      CheckUpdate: "檢查更新",
      IsChecking: "正在檢查更新...",
      FoundUpdate: (x: string) => `發現新版本：${x}`,
      GoToUpdate: "前往更新",
    },
    SendKey: "發送鍵",
    Theme: "主題",
    TightBorder: "緊湊邊框",
    SendPreviewBubble: {
      Title: "預覽氣泡",
      SubTitle: "在预览气泡中预览 Markdown 内容",
    },
    Mask: {
      Title: "面具启动页",
      SubTitle: "新建聊天时，展示面具启动页",
    },
    Prompt: {
      Disable: {
        Title: "停用提示詞自動補齊",
        SubTitle: "在輸入框開頭輸入 / 即可觸發自動補齊",
      },
      List: "自定義提示詞列表",
      ListCount: (builtin: number, custom: number) =>
        `內建 ${builtin} 條，用戶定義 ${custom} 條`,
      Edit: "編輯",
      Modal: {
        Title: "提示詞列表",
        Add: "新增一條",
        Search: "搜尋提示詞",
      },
      EditModal: {
        Title: "编辑提示词",
      },
    },
    HistoryCount: {
      Title: "附帶歷史訊息數",
      SubTitle: "每次請求附帶的歷史訊息數",
    },
    CompressThreshold: {
      Title: "歷史訊息長度壓縮閾值",
      SubTitle: "當未壓縮的歷史訊息超過該值時，將進行壓縮",
    },
    Token: {
      Title: "API Key",
      SubTitle: "使用自己的 Key 可規避授權存取限制",
      Placeholder: "OpenAI API Key",
    },
    Usage: {
      Title: "帳戶餘額",
      SubTitle(used: any, total: any) {
        return `本月已使用 $${used}，訂閱總額 $${total}`;
      },
      IsChecking: "正在檢查…",
      Check: "重新檢查",
      NoAccess: "輸入API Key查看餘額",
    },
    AccessCode: {
      Title: "授權碼",
      SubTitle: "目前是未授權存取狀態",
      Placeholder: "請輸入授權碼",
    },
    Model: "模型 (model)",
    Temperature: {
      Title: "隨機性 (temperature)",
      SubTitle: "值越大，回應越隨機",
    },
    MaxTokens: {
      Title: "單次回應限制 (max_tokens)",
      SubTitle: "單次互動所用的最大 Token 數",
    },
    PresencePenalty: {
      Title: "話題新穎度 (presence_penalty)",
      SubTitle: "值越大，越有可能擴展到新話題",
    },
    FrequencyPenalty: {
      Title: "頻率懲罰度 (frequency_penalty)",
      SubTitle: "值越大，越有可能降低重複字詞",
    },
  },
  Store: {
    DefaultTopic: "新的對話",
    BotHello: "請問需要我的協助嗎？",
    Error: "出錯了，請稍後再嘗試",
    Prompt: {
      History: (content: string) =>
        "這是 AI 與用戶的歷史聊天總結，作為前情提要：" + content,
      Topic:
        "Use the language used by the user (e.g. en for english conversation, zh-hant for chinese conversation, etc.) to generate a title (at most 6 words) summarizing our conversation without any lead-in, quotation marks, preamble like 'Title:', direct text copies, single-word replies, quotation marks, translations, or brackets. Remove enclosing quotation marks. The title should make third-party grasp the essence of the conversation in first sight.",
      Summarize:
        "Use the language used by the user (e.g. en-us for english conversation, zh-hant for chinese conversation, etc.) to summarise the conversation in at most 200 words. The summary will be used as prompt for you to continue the conversation in the future.",
    },
  },
  Copy: {
    Success: "已複製到剪貼簿中",
    Failed: "複製失敗，請賦予剪貼簿權限",
  },
  Context: {
    Toast: (x: any) => `已設定 ${x} 條前置上下文`,
    Edit: "前置上下文和歷史記憶",
    Add: "新增一條",
  },
  Plugin: { Name: "插件" },
  Mask: {
    Name: "面具",
    Page: {
      Title: "预设角色面具",
      SubTitle: (count: number) => `${count} 个预设角色定义`,
      Search: "搜索角色面具",
      Create: "新建",
    },
    Item: {
      Info: (count: number) => `包含 ${count} 条预设对话`,
      Chat: "对话",
      View: "查看",
      Edit: "编辑",
      Delete: "删除",
      DeleteConfirm: "确认删除？",
    },
    EditModal: {
      Title: (readonly: boolean) =>
        `编辑预设面具 ${readonly ? "（只读）" : ""}`,
      Download: "下载预设",
      Clone: "克隆预设",
    },
    Config: {
      Avatar: "角色头像",
      Name: "角色名称",
    },
  },
  NewChat: {
    Return: "返回",
    Skip: "跳过",
    Title: "挑选一个面具",
    SubTitle: "现在开始，与面具背后的灵魂思维碰撞",
    More: "搜索更多",
    NotShow: "不再展示",
    ConfirmNoShow: "确认禁用？禁用后可以随时在设置中重新启用。",
  },
  UI: {
    Confirm: "确认",
    Cancel: "取消",
    Close: "关闭",
    Create: "新建",
    Edit: "编辑",
  },
  Exporter: {
    Model: "模型",
    Messages: "消息",
    Topic: "主題",
    Time: "時間",
  },
};

export default tw;
