import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NextImage from "next/image";
import WechatPayLogo from "../icons/wechat-pay-logo.png";

import styles from "./pay.module.scss";

import CloseIcon from "../icons/close.svg";
import { ErrorBoundary } from "./error";
import { useAuthStore, useWebsiteConfigStore } from "../store";

import { IconButton } from "./button";
import { Path } from "../constant";

import Locale from "../locales";

export function Pay() {
  const navigate = useNavigate();
  const authStore = useAuthStore();

  const { payPageTitle, payPageSubTitle } = useWebsiteConfigStore();

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orderUuid = params.get("uuid");
  const [order, setOrder] = useState(null as any);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(true);
  // const [error, setError] = useState(false)

  const [qrCode, setQrCode] = useState("");
  useEffect(() => {
    setLoading(true);
    fetch("/api/order/" + orderUuid, {
      method: "get",
      headers: {
        Authorization: "Bearer " + authStore.token,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        const order = res.data;
        console.log("order", order);
        setOrder(order);
        if (order.state === 5) {
          setQrCode(order.payUrl);
          setPaying(true);
        } else {
          setPaying(false);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      // console.log('qrCode', qrCode)
      if (!qrCode) {
        return;
      }
      fetch("/api/order/" + orderUuid, {
        method: "get",
        headers: {
          Authorization: "Bearer " + authStore.token,
        },
      })
        .then((res) => res.json())
        .then((res) => {
          const order = res.data;
          console.log("order.state", order.state);
          setOrder(order);
          if (order.state != 5) {
            setPaying(false);
            clearInterval(timer);
          } else {
            setPaying(false);
          }
        });
    }, 1200);

    return () => {
      console.log("clearInterval");
      clearInterval(timer);
    };
  }, [qrCode]);

  return (
    <ErrorBoundary>
      <div className="window-header">
        <div className="window-header-title">
          <div className="window-header-main-title">
            {payPageTitle || "订单支付"}
          </div>
          <div className="window-header-sub-title">{payPageSubTitle || ""}</div>
        </div>
        <div className="window-actions">
          <div className="window-action-button">
            <IconButton
              icon={<CloseIcon />}
              onClick={() => navigate(Path.Home)}
              bordered
              title={Locale.PayPage.Actions.Close}
            />
          </div>
        </div>
      </div>
      <div className={styles["pay"]}>
        <div className={styles["container"]}>
          <NextImage
            src={WechatPayLogo.src}
            width={127}
            height={27}
            alt="wechat-pay"
          />
          <div style={{ marginTop: "10px" }}>
            {order ? order.title : "套餐购买"}
          </div>
          <div style={{ lineHeight: "50px" }}>
            ￥<span style={{ fontSize: "32px" }}>{order && order.price}</span>
          </div>
          {qrCode && <img src={qrCode} width={230} height={230} alt="qrcode" />}
          {loading && (
            <div
              style={{
                width: "230px",
                height: "230px",
                backgroundColor: "#f0f0f0",
                lineHeight: "230px",
                textAlign: "center",
              }}
            >
              Loading
            </div>
          )}
          <div className={styles["bottom"]}>请使用微信扫码支付</div>
        </div>

        {order && (
          <div style={{ textAlign: "center", margin: "20px" }}>
            当前订单：
            {order.state === 0
              ? "未提交"
              : order.state === 5
              ? order.payUrl
                ? "待支付"
                : "已超时"
              : order.state === 6
              ? "提交失败"
              : order.state === 10
              ? "已支付"
              : order.state === 12
              ? "支付失败"
              : order.state === 20
              ? "已取消"
              : order.state === 30
              ? "已删除"
              : ""}
          </div>
        )}

        <div className={styles["buttons"]}>
          <div style={{ marginBottom: "10px" }}>
            <IconButton
              text={Locale.Profile.Actions.Pricing}
              block={true}
              type="second"
              onClick={() => {
                navigate(Path.Pricing);
              }}
            />
          </div>
          <div>
            <IconButton
              text={Locale.PricingPage.Actions.Order}
              block={true}
              type="second"
              onClick={() => {
                navigate(Path.Order);
              }}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
