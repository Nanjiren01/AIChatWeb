import { useState, useEffect } from "react";
import NextImage from "next/image";

import styles from "./forget-password.module.scss";

import CloseIcon from "../icons/close.svg";
import ChatBotIcon from "../icons/ai-chat-bot.png";
import { SingleInput, Input, List, ListItem, PasswordInput } from "./ui-lib";

import { IconButton } from "./button";
import { useAuthStore, useAccessStore, useWebsiteConfigStore } from "../store";

import Locale from "../locales";
import { Path } from "../constant";
import { ErrorBoundary } from "./error";
import { useNavigate } from "react-router-dom";
import { showToast } from "./ui-lib";

export function ForgetPassword(props: {
  logoLoading: boolean;
  logoUrl?: string;
}) {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  // const accessStore = useAccessStore();
  const { registerTypes, mainTitle, hideChatLogWhenNotLogin } =
    useWebsiteConfigStore();
  const registerType = registerTypes[0];
  const REG_TYPE_ONLY_USERNAME = "OnlyUsername";
  const REG_TYPE_USERNAME_WITH_CAPTCHA = "OnlyUsernameWithCaptcha";
  const REG_TYPE_USERNAME_AND_EMAIL_WITH_CAPTCHA_AND_CODE =
    "UsernameAndEmailWithCaptchaAndCode";
  const REG_TYPE_PHONE_WITH_CAPTCHA_AND_CODE = "PhoneWithCaptchaAndCode";

  const [loadingUsage, setLoadingUsage] = useState(false);
  // const [captcha, setCaptcha] = useState("");

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

  function generateUUID() {
    var d = new Date().getTime();
    var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
      },
    );
    return uuid;
  }

  const [captchaId, setCaptchaId] = useState("register-" + generateUUID());
  const [captcha, setCaptcha] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailCodeSending, setEmailCodeSending] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneCodeSending, setPhoneCodeSending] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [comfirmedPassword, setComfirmedPassword] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  function handleClickSendEmailCode() {
    if (email === null || email === "") {
      showToast(Locale.RegisterPage.Toast.EmailIsEmpty);
      return;
    }
    if (captchaInput == null || captchaInput === "") {
      showToast(Locale.RegisterPage.CaptchaIsEmpty);
      return;
    }
    setEmailCodeSending(true);
    authStore
      .sendEmailCodeForResetPassword(email, captchaId, captchaInput)
      .then((resp) => {
        if (resp.code == 0) {
          showToast(Locale.RegisterPage.Toast.EmailCodeSent);
          return;
        }
        if (resp.code == 10121) {
          showToast(Locale.RegisterPage.Toast.EmailFormatError);
          return;
        } else if (resp.code == 10122) {
          showToast(Locale.RegisterPage.Toast.EmailCodeSentFrequently);
          return;
        }
        showToast(resp.cnMessage || resp.message);
      })
      .finally(() => {
        setEmailCodeSending(false);
      });
  }
  function handleClickSendPhoneCode() {
    if (phone === null || phone === "") {
      showToast(Locale.RegisterPage.Toast.PhoneIsEmpty);
      return;
    }
    if (captchaInput == null || captchaInput === "") {
      showToast(Locale.RegisterPage.CaptchaIsEmpty);
      return;
    }
    setPhoneCodeSending(true);
    authStore
      .sendPhoneCode(phone, captchaId, captchaInput, true)
      .then((resp) => {
        if (resp.code == 0) {
          showToast(Locale.RegisterPage.Toast.PhoneCodeSent);
          return;
        }
        if (resp.code == 10121) {
          showToast(Locale.RegisterPage.Toast.PhoneFormatError);
          return;
        } else if (resp.code == 10122) {
          showToast(Locale.RegisterPage.Toast.PhoneCodeSentFrequently);
          return;
        }
        showToast(resp.cnMessage || resp.message);
      })
      .finally(() => {
        setPhoneCodeSending(false);
      });
  }
  function resetPassword() {
    if (password == null || password.length == 0) {
      showToast(Locale.RegisterPage.Toast.PasswordEmpty);
      return;
    }
    if (registerType === REG_TYPE_USERNAME_AND_EMAIL_WITH_CAPTCHA_AND_CODE) {
      if (email === null || email == "") {
        showToast(Locale.RegisterPage.Toast.EmailIsEmpty);
        return;
      }
      if (emailCode === null || emailCode === "") {
        showToast(Locale.RegisterPage.Toast.EmailCodeEmpty);
        return;
      }
    } else if (registerType === REG_TYPE_PHONE_WITH_CAPTCHA_AND_CODE) {
      if (phone === null || phone == "") {
        showToast(Locale.RegisterPage.Toast.PhoneIsEmpty);
        return;
      }
      if (phoneCode === null || phoneCode === "") {
        showToast(Locale.RegisterPage.Toast.PhoneCodeEmpty);
        return;
      }
    }
    setLoadingUsage(true);
    showToast(Locale.ForgetPasswordPage.Toast.PasswordResetting);
    authStore
      .resetPassword(password, email, emailCode, phone, phoneCode)
      .then((result) => {
        console.log("result", result);
        if (!result) {
          showToast(Locale.ForgetPasswordPage.Toast.PasswordResetFailed);
          return;
        }
        if (result.code == 0) {
          showToast(Locale.ForgetPasswordPage.Toast.PasswordResetSuccess);
          navigate(Path.Chat);
        } else {
          if (result.cnMessage || result.message) {
            showToast(
              Locale.ForgetPasswordPage.Toast.PasswordResetFailedWithReason +
                (result.cnMessage || result.message),
            );
          } else {
            showToast(Locale.RegisterPage.Toast.Failed);
          }
        }
      })
      .finally(() => {
        setLoadingUsage(false);
      });
  }

  function getRegisterCaptcha(captchaId: string) {
    // console.log('getRegisterCaptcha', captchaId)
    const url = "/getRegisterCaptcha?captchaId=" + captchaId;
    const BASE_URL = process.env.BASE_URL;
    const mode = process.env.BUILD_MODE;
    let requestUrl = (mode === "export" ? BASE_URL : "") + "/api" + url;
    fetch(requestUrl, {
      method: "get",
    }).then(async (resp) => {
      const result = await resp.json();
      if (result.code != 0) {
        showToast(result.message);
      } else {
        setCaptcha("data:image/jpg;base64," + result.data);
      }
    });
  }
  useEffect(() => {
    getRegisterCaptcha(captchaId);
  }, [captchaId]);

  return (
    <ErrorBoundary>
      <div className="window-header" data-tauri-drag-region>
        <div className="window-header-title">
          <div className="window-header-main-title">
            {Locale.ForgetPasswordPage.Title}
          </div>
          <div className="window-header-sub-title">
            {Locale.ForgetPasswordPage.SubTitle}
          </div>
        </div>
        <div className="window-actions">
          <div className="window-action-button">
            <IconButton
              icon={<CloseIcon />}
              onClick={() => navigate(Path.Home)}
              bordered
              title={Locale.ForgetPasswordPage.Actions.Close}
            />
          </div>
        </div>
      </div>
      <div className={styles["forget-password"]}>
        {hideChatLogWhenNotLogin && (
          <div style={{ textAlign: "center" }}>
            <div className={styles["sidebar-logo"] + " no-dark"}>
              {props.logoLoading ? (
                <></>
              ) : !props.logoUrl ? (
                <NextImage
                  src={ChatBotIcon.src}
                  width={64}
                  height={64}
                  alt="bot"
                />
              ) : (
                <img src={props.logoUrl} width={64} height={64} />
              )}
            </div>
            <div
              style={{ lineHeight: "100px" }}
              dangerouslySetInnerHTML={{
                __html: mainTitle || "AI Chat",
              }}
              data-tauri-drag-region
            ></div>
          </div>
        )}
        <List>
          {registerType ===
            REG_TYPE_USERNAME_AND_EMAIL_WITH_CAPTCHA_AND_CODE && (
            <ListItem
              title={Locale.RegisterPage.Email.Title}
              subTitle={Locale.RegisterPage.Email.SubTitle}
            >
              <SingleInput
                value={email}
                placeholder={Locale.RegisterPage.Email.Placeholder}
                onChange={(e) => {
                  setEmail(e.currentTarget.value);
                }}
              />
            </ListItem>
          )}

          {registerType === REG_TYPE_PHONE_WITH_CAPTCHA_AND_CODE && (
            <ListItem
              title={Locale.RegisterPage.Phone.Title}
              subTitle={Locale.RegisterPage.Phone.SubTitle}
            >
              <SingleInput
                value={phone}
                placeholder={Locale.RegisterPage.Phone.Placeholder}
                onChange={(e) => {
                  setPhone(e.currentTarget.value);
                }}
              />
            </ListItem>
          )}

          <ListItem title={Locale.RegisterPage.Captcha}>
            <div>
              {captcha ? (
                <img
                  alt={Locale.RegisterPage.Captcha}
                  src={captcha}
                  width="100"
                  height="40"
                  title={Locale.RegisterPage.CaptchaTitle}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => getRegisterCaptcha(captchaId)}
                />
              ) : (
                <></>
              )}
            </div>
          </ListItem>
          <ListItem
            title={Locale.RegisterPage.CaptchaInput.Title}
            subTitle={Locale.RegisterPage.CaptchaInput.SubTitle}
          >
            <SingleInput
              value={captchaInput}
              placeholder={Locale.RegisterPage.CaptchaInput.Placeholder}
              onChange={(e) => {
                setCaptchaInput(e.currentTarget.value);
              }}
            />
          </ListItem>

          {registerType ===
            REG_TYPE_USERNAME_AND_EMAIL_WITH_CAPTCHA_AND_CODE && (
            <>
              <ListItem>
                <IconButton
                  text={
                    emailCodeSending
                      ? Locale.RegisterPage.Toast.EmailCodeSending
                      : Locale.RegisterPage.Toast.SendEmailCode
                  }
                  disabled={emailCodeSending}
                  onClick={() => {
                    handleClickSendEmailCode();
                  }}
                />
              </ListItem>

              <ListItem
                title={Locale.RegisterPage.EmailCode.Title}
                subTitle={Locale.RegisterPage.EmailCode.SubTitle}
              >
                <SingleInput
                  value={emailCode}
                  placeholder={Locale.RegisterPage.EmailCode.Placeholder}
                  onChange={(e) => {
                    setEmailCode(e.currentTarget.value);
                  }}
                />
              </ListItem>
            </>
          )}

          {registerType === REG_TYPE_PHONE_WITH_CAPTCHA_AND_CODE && (
            <>
              <ListItem>
                <IconButton
                  text={
                    phoneCodeSending
                      ? Locale.RegisterPage.Toast.PhoneCodeSending
                      : Locale.RegisterPage.Toast.SendPhoneCode
                  }
                  disabled={phoneCodeSending}
                  onClick={() => {
                    handleClickSendPhoneCode();
                  }}
                />
              </ListItem>

              <ListItem
                title={Locale.RegisterPage.PhoneCode.Title}
                subTitle={Locale.RegisterPage.PhoneCode.SubTitle}
              >
                <SingleInput
                  value={phoneCode}
                  placeholder={Locale.RegisterPage.PhoneCode.Placeholder}
                  onChange={(e) => {
                    setPhoneCode(e.currentTarget.value);
                  }}
                />
              </ListItem>
            </>
          )}

          <ListItem
            title={Locale.RegisterPage.Password.Title}
            subTitle={Locale.RegisterPage.Password.SubTitle}
          >
            <PasswordInput
              value={password}
              type="text"
              placeholder={Locale.RegisterPage.Password.Placeholder}
              onChange={(e) => {
                setPassword(e.currentTarget.value);
              }}
            />
          </ListItem>

          <ListItem>
            <IconButton
              type="primary"
              text={Locale.ForgetPasswordPage.Title}
              block={true}
              disabled={loadingUsage}
              onClick={() => {
                resetPassword();
              }}
            />
          </ListItem>

          <ListItem>
            <IconButton
              text={Locale.RegisterPage.GoToLogin}
              type="second"
              onClick={() => {
                authStore.logout();
                navigate(Path.Login);
              }}
            />
          </ListItem>
        </List>
      </div>
    </ErrorBoundary>
  );
}
