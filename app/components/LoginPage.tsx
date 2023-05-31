"use client";

import React from "react";
import { Login } from "../components/login";
import "./login-page.scss";

// export const LoginPage: React.FC = () => {
export function LoginPage(props: {}) {
  return (
    <div className="login-page">
      <div className="login-content">
        <Login />
      </div>
    </div>
  );
};