import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { Trans } from "@lingui/macro";
import { Avatar, Menu } from "antd";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";

import { accessAtom } from "@/atoms/access";
import { loginStateAtom } from "@/atoms/login";

import HeaderDropdown from "../HeaderDropdown";
import styles from "./index.less";

const newConfig = [
  {
    name: "测试1",
    path: "/a-new-address", // 解析为/ab/a
    component: "test1", // page 建议使用小写，内部会转换成大写,对应到组件上。权限配置中与此保持一致
    access: "test1Open",
  },
  {
    name: "测试4",
    path: "/counter", // 解析为/c
    component: "test4",
    access: "test4Open",
  },
  {
    name: "微前端",
    path: "/micro",
    icon: "PaperClipOutlined",
    children: [
      {
        name: "vue2测试",
        path: "vue2/*",
        access: "microOpen",
        component: "http://localhost:8001", // 微前端配置
      },
    ],
  },
];

const AvatarDropdown: React.FC = () => {
  // const { menu } = props;
  const [login, setLogin] = useRecoilState(loginStateAtom);

  const [, setAccess] = useRecoilState(accessAtom);
  const navigate = useNavigate();
  const handleChangeRole = () => {
    setAccess({
      microOpen: true,
      test1Open: true,
      test4Open: true,
      logionPermit: true,
      // 'example': role === 'admin',
      // 'example2': some => some.prop === 'test'
    });
    setLogin({
      ...login,
      route:newConfig
    })
    navigate(newConfig[0].path, { replace: true });
  };

  const logout = () => {
    setLogin({
      ...login,
      isLogin: false,
    });
  };

  const menuHeaderDropdown = (
    <Menu className={styles.menu} selectedKeys={[]}>
      <Menu.Item key="changeRole" onClick={() => handleChangeRole()}>
        <UserOutlined />
        <Trans>切换角色</Trans>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" onClick={() => logout()}>
        <LogoutOutlined />
        <Trans>退出登录</Trans>
      </Menu.Item>
    </Menu>
  );

  return (
    <HeaderDropdown overlay={menuHeaderDropdown}>
      <span className={`${styles.action} ${styles.account}`}>
        <Avatar
          size="small"
          className={styles.avatar}
          style={{ backgroundColor: "#ffbf00", verticalAlign: "middle" }}
          alt="avatar"
        >
          {login.account}
        </Avatar>
      </span>
    </HeaderDropdown>
  );
};

export default AvatarDropdown;
