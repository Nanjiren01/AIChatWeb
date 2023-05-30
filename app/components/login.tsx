import { useState, useEffect } from "react";
import styles from "./login.module.scss";
import { Input, List, ListItem, Modal, PasswordInput } from "./ui-lib";
import { IconButton } from "./button";
import { useAuthStore, useAccessStore, useWebsiteConfigStore } from "../store";
import Locale from "../locales";
import { Path } from "../constant";
import { ErrorBoundary } from "./error";
import { useNavigate } from "react-router-dom";
import { showToast } from "../components/ui-lib";

export function Login() {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const accessStore = useAccessStore();
  const { loginPageSubTitle } = useWebsiteConfigStore();

  const [loadingUsage, setLoadingUsage] = useState(false);

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
  }, []);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  function login() {
    setLoadingUsage(true);
    showToast(Locale.LoginPage.Toast.Logining);
    authStore
      .login(username, password)
      .then((result) => {
        if (result && result.code == 0) {
          showToast(Locale.LoginPage.Toast.Success);
          navigate(Path.Chat);
        } else if (result && result.message) {
          showToast(result.message);
        }
      })
      .finally(() => {
        setLoadingUsage(false);
      });
  }
  function logout() {
    setTimeout(() => authStore.logout(), 500);
  }

  return (
    <ErrorBoundary>
      <div className={styles["login"]}>
        <div className="login-title">
          <h2>{Locale.LoginPage.Title}</h2>
          <h3>{loginPageSubTitle}</h3>
        </div>
        <List>
          <ListItem
            title={Locale.LoginPage.Username.Title}
            subTitle={Locale.LoginPage.Username.SubTitle}
          >
            {authStore.username ? (
              <span>{authStore.username}</span>
            ) : (
              <Input
                value={username}
                rows={1}
                onChange={(e) => {
                  setUsername(e.currentTarget.value);
                }}
              />
            )}
          </ListItem>
          {authStore.username ? (
            <></>
          ) : (
            <ListItem
              title={Locale.LoginPage.Password.Title}
              subTitle={Locale.LoginPage.Password.SubTitle}
            >
              <PasswordInput
                value={password}
                type="text"
                placeholder={Locale.LoginPage.Password.Placeholder}
                onChange={(e) => {
                  setPassword(e.currentTarget.value);
                }}
              />
            </ListItem>
          )}
          <ListItem>
            <IconButton
              type="primary"
              text={
                authStore.username
                  ? Locale.LoginPage.Actions.Logout
                  : Locale.LoginPage.Actions.Login
              }
              block={true}
              onClick={() => {
                if (authStore.username) {
                  logout();
                } else {
                  login();
                }
              }}
            />
          </ListItem>
          {authStore.username ? (
            <></>
          ) : (
            <ListItem>
              <IconButton
                text={Locale.LoginPage.GoToRegister}
                onClick={() => {
                  navigate(Path.Register);
                }}
              />
            </ListItem>
          )}
        </List>
      </div>
    </ErrorBoundary>
  );
}
