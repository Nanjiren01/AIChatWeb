import { useState, useEffect } from "react";

import styles from "./order.module.scss";

import CloseIcon from "../icons/close.svg";
import {
  Input,
  List,
  DangerousListItem,
  ListItem,
  Modal,
  PasswordInput,
} from "./ui-lib";

import { IconButton } from "./button";
import {
  useAuthStore,
  useAccessStore,
  useAppConfig,
  useProfileStore,
} from "../store";

import Locale from "../locales";
import { Path } from "../constant";
import { ErrorBoundary } from "./error";
import { useNavigate } from "react-router-dom";
import { showToast, Popover } from "./ui-lib";
// import { Avatar, AvatarPicker } from "./emoji";
import { Package } from "./pricing";

interface OrderLog {
  time: Date;
  type: string;
  message: any;
}

interface OrderPackage {
  id: number;
  orderId: number;
  packageId: number;
  count: number;
  state: number;

  // 以下是快照
  drawCount: number;
  chatCount: number;
  advancedChatCount: number;
  tokens: number;
  days: number;
  calcTypeId: number;
  title: string;
  price: string;
}

interface Order {
  id: number;
  uuid: string;
  userId: number;
  title: string;
  state: number;
  price: string;
  createTime: Date;
  updateTime: Date;
  submitTime?: Date;
  payTime?: Date;
  payUrl: string;

  logs?: string;
  orderPackages: OrderPackage[];
}
interface OrderListResponse {
  code: number;
  message?: string;
  data: Order[];
}

export function Order() {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  // const accessStore = useAccessStore();
  const profileStore = useProfileStore();

  // const config = useAppConfig();
  // const updateConfig = config.update;

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const keydownEvent = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate(Path.Home);
      }
    };
    document.addEventListener("keydown", keydownEvent);
    return () => {
      document.removeEventListener("keydown", keydownEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClickPay(order: any) {
    console.log("handleClickPay", order);
    if (order.state !== 5) {
      showToast(Locale.OrderPage.StateError + " order uuid: " + order.uuid);
    }
    window.open(order.payUrl);
  }

  // todo 恢复
  useEffect(() => {
    if (profileStore.id === 0) {
      console.log("profileStore.id", profileStore.id);
      navigate(Path.Login);
    }
  }, [profileStore, navigate]);

  function getSubTitle(order: any) {
    const pkg = order.orderPackages[0] as Package;
    const prefix = {
      1: "总额",
      2: "每天",
      3: "每小时",
      4: "每3小时",
    }[pkg.calcTypeId];
    return (
      `<ul style="margin-top: 5px;padding-inline-start: 10px;">` +
      (pkg.tokens
        ? `<li>${prefix} <span style="font-size: 18px;">${pkg.tokens}</span> tokens</li>`
        : "") +
      (pkg.chatCount
        ? `<li>${prefix} <span style="font-size: 18px;">${pkg.chatCount}</span> 次基础聊天（GPT3.5）</li>`
        : "") +
      (pkg.advancedChatCount
        ? `<li>${prefix} <span style="font-size: 18px;">${pkg.advancedChatCount}</span> 次高级聊天（GPT4）</li>`
        : "") +
      (pkg.drawCount
        ? `<li>${prefix} <span style="font-size: 18px;">${pkg.drawCount}</span> 次AI绘画</li>`
        : "") +
      `<li>有效期： <span style="font-size: 18px;">${pkg.days}</span> 天</li>` +
      `</ul>`
    );
  }

  function getStateText(order: any) {
    return (
      {
        0: "待提交",
        5: "待支付",
        6: "创建失败",
        10: "已支付",
        12: "支付失败",
        20: "已取消",
        30: "已删除",
      } as any
    )[order.state];
  }

  const [orderList, setOrderList] = useState<Order[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // for debugging
    // setOrderList([
    //   { uuid: 'aaaa-aaaa-aaaa-aaaa-aaa', state: 0, title: '套餐购买：小时卡', price: '0.1', createTime: '2023-06-11 06:04:27', payTime: null, orderPackages: [{typeId: 1, tokens: 0, chatCount: 100, advancedChatCount: 1, drawCount: 1, days: 1, calcTypeId: 1}]},
    //   { uuid: 'aaaa-aaaa-aaaa-aaaa-aaa', state: 5, title: '套餐购买：小时卡', price: '0.1', createTime: '2023-06-11 07:04:27', payTime: null, orderPackages: [{typeId: 1, tokens: 0, chatCount: 0, advancedChatCount: 0, drawCount: 1, days: 1, calcTypeId: 1}]},
    //   { uuid: 'aaaa-aaaa-aaaa-aaaa-aaa', state: 6, title: '套餐购买：小时卡', price: '0.1', createTime: '2023-06-11 08:04:27', payTime: null, orderPackages: [{typeId: 1, tokens: 10, chatCount: 100, advancedChatCount: 0, drawCount: 1, days: 1, calcTypeId: 1}]},
    //   { uuid: 'aaaa-aaaa-aaaa-aaaa-aaa', state: 10, title: '套餐购买：小时卡', price: '0.1', createTime: '2023-06-11 09:04:27', payTime: '2023-06-16 06:04:27', orderPackages: [{typeId: 1, tokens: 0, chatCount: 100, advancedChatCount: 0, drawCount: 0, days: 1, calcTypeId: 1}]},
    //   { uuid: 'aaaa-aaaa-aaaa-aaaa-aaa', state: 12, title: '套餐购买：小时卡', price: '0.1', createTime: '2023-06-11 10:04:27', payTime: null, orderPackages: [{typeId: 1, tokens: 0, chatCount: 100, advancedChatCount: 0, drawCount: 0, days: 1, calcTypeId: 1}]},
    //   { uuid: 'aaaa-aaaa-aaaa-aaaa-aaa', state: 20, title: '套餐购买：小时卡', price: '0.1', createTime: '2023-06-11 11:04:27', cancelTime: '2023-06-16 06:04:27', orderPackages: [{typeId: 1, tokens: 0, chatCount: 100, advancedChatCount: 0, drawCount: 0, days: 1, calcTypeId: 1}]},
    //   { uuid: 'aaaa-aaaa-aaaa-aaaa-aaa', state: 30, title: '套餐购买：小时卡', price: '0.1', createTime: '2023-06-11 12:04:27', payTime: '2023-06-16 06:04:27', orderPackages: [{typeId: 1, tokens: 0, chatCount: 100, advancedChatCount: 0, drawCount: 0, days: 1, calcTypeId: 1}]},
    // ])
    setLoading(true);
    fetch("/api/order/my", {
      method: "get",
      headers: {
        Authorization: "Bearer " + authStore.token,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        const ordersResp = res as unknown as OrderListResponse;
        if (ordersResp.code !== 0) {
          setErrorMessage(ordersResp.message || "");
          return;
        }
        const orders = ordersResp.data || [];
        setOrderList(orders);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authStore.token]);

  return (
    <ErrorBoundary>
      <div className="window-header">
        <div className="window-header-title">
          <div className="window-header-main-title">
            {Locale.OrderPage.Title}
          </div>
          <div className="window-header-sub-title">
            {/* {Locale.Profile.SubTitle} */}
          </div>
        </div>
        <div className="window-actions">
          <div className="window-action-button">
            <IconButton
              icon={<CloseIcon />}
              onClick={() => navigate(Path.Home)}
              bordered
              title={Locale.Profile.Actions.Close}
            />
          </div>
        </div>
      </div>
      <div className={styles["order"]}>
        {orderList.length === 0 ? (
          <List>
            <div
              className={errorMessage ? styles["danger-text"] : ""}
              style={{
                height: "100px",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {errorMessage
                ? errorMessage
                : loading
                ? Locale.OrderPage.Loading
                : Locale.OrderPage.NoOrder}
            </div>
          </List>
        ) : (
          <></>
        )}
        {orderList.length ? (
          <List>
            {orderList.map((order) => {
              return (
                <DangerousListItem
                  key={order.uuid}
                  title={order.title}
                  subTitle={getSubTitle(order)}
                >
                  <div style={{ minWidth: "100px" }}>
                    <div
                      style={{
                        margin: "10px",
                        fontSize: "24px",
                        textAlign: "center",
                      }}
                    >
                      ￥{order.price}
                    </div>
                    <div style={{ fontSize: "14px" }}>
                      状态：{getStateText(order)}
                    </div>
                    <div
                      style={{ fontSize: "14px" }}
                    >{`创建时间：${order.createTime}`}</div>
                    {order.payTime && (
                      <div style={{ fontSize: "14px" }}>{`支付时间：${
                        order.payTime || ""
                      }`}</div>
                    )}
                    {order.state === 5 && (
                      <div style={{ marginBottom: "15px", marginTop: "15px" }}>
                        <IconButton
                          text={Locale.OrderPage.Actions.Pay}
                          type="primary"
                          block={true}
                          disabled={loading}
                          onClick={() => {
                            handleClickPay(order);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </DangerousListItem>
              );
            })}
          </List>
        ) : (
          <></>
        )}

        <List>
          <ListItem>
            <IconButton
              text={Locale.OrderPage.Actions.Pricing}
              block={true}
              type="primary"
              onClick={() => {
                navigate(Path.Pricing);
              }}
            />
          </ListItem>
          <ListItem>
            <IconButton
              text={Locale.OrderPage.Actions.Profile}
              block={true}
              type="second"
              onClick={() => {
                navigate(Path.Profile);
              }}
            />
          </ListItem>
        </List>
      </div>
    </ErrorBoundary>
  );
}
