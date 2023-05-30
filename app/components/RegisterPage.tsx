"use client";

import React from "react";
import { Register } from "../components/register";
import "./register-page.scss";

// export const RegisterPage: React.FC = () => {
export function RegisterPage(props: {}) {
  return (
    <div className="register-page">
      <div className="register-content">
         <Register />
      </div>
    </div>
  );
};