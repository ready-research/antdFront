import ProLayout, { SettingDrawer } from "@ant-design/pro-layout";
import defaultSettings from "@ant-design/pro-layout/es/defaultSettings";
// import { useCreation, useSafeState } from "ahooks";
import {  useSafeState } from "ahooks";
import _ from "lodash";
import memoized from "nano-memoize";
import React, { Suspense } from "react";
import {
  matchRoutes,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useRecoilValue } from "recoil";

import logo from "@/assets/logo.svg";
import { curLocaleLoadAtom } from "@/atoms/locale";
import { transDynamicRouteAtom } from "@/atoms/route";
import { tabsModelAtom } from "@/atoms/tabsModel";
import { RightContent } from "@/components/GlobalHeader";
import PageLoading from "@/components/PageLoading";
import TabRoute from "@/components/TabRoute";
import { DynamicRouteType } from "@/config/routes";

import styles from "./BasicLayout.less";

// 从config里 把 匹配的信息 调出来
// 放这因为activekey 在 prolayout 和 tabroute之间共享。
const pickRoutes = memoized((routes: DynamicRouteType[], pathname: string,locale: string) => {
  const matches = matchRoutes(routes, { pathname });
  const routeConfig: any = matches ? matches[matches.length - 1].route : null;
  return {
    locale, // just for cache
    routeConfig,
    // matchPath: matches ? matches.map(match => _.replace(match.route.path,'/*','')).join('/') : null // 解决下微端/*路径的问题
    matchPath: routeConfig ? _.replace(routeConfig.key, "/*", "") : '',
  };
});

const BasicLayout: React.FC = () => {
  const location = useLocation();
  const [settings, setSetting] = useSafeState<any>({
    ...defaultSettings,
    fixSiderbar: true,
    fixedHeader: true,
  });
  const locale = useRecoilValue(curLocaleLoadAtom);
  const tabsModel = useRecoilValue(tabsModelAtom);

  const navigate = useNavigate();

  // const orgRoute = useRecoilValue(dynamicRouteAtom);

  const route = useRecoilValue(transDynamicRouteAtom);
  // 手工转换下
  // transDynamicConfigAtom 貌似无法触发prolayout 的menu 更新，深表痛心。
  // const route = useCreation(
  //   () => translateNameProperty(orgRoute, locale),
  //   [orgRoute, locale],
  // );

  // const feedToProlayoutRoute = useCreation(() => _.cloneDeep(route), [locale,route]);

  const { routeConfig, matchPath } = pickRoutes(route, location.pathname,locale);

  return (
    <div id="prolayout" key="prolayout">
      <ProLayout
        style={{
          height: "100vh",
        }}
        // menuDataRender={() => feedToProlayoutRoute}
        menuDataRender={() => route}
        menuItemRender={(item:any, dom:any) => (
          <div
            onClick={() => {
              // fullPath 为加工过 '/*' 的路径
              navigate(item.fullPath, { replace: true });
            }}
          >
            {" "}
            {dom}
          </div>
        )}
        selectedKeys={[matchPath]}
        menuHeaderRender={() => (
          <div
            id="customize_menu_header"
            className={styles.logo}
            onClick={() => {
              window.open("www.baidu.com");
            }}
          >
            <img src={logo} />
            <h1>Antd Front</h1>
          </div>
        )}
        rightContentRender={() => <RightContent />}
        {...settings}
      >
        {/* <PageContainer> */}
        {tabsModel ? (
          <TabRoute routeConfig={routeConfig} matchPath={matchPath} />
        ) : (
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        )}
        {/* </PageContainer> */}
      </ProLayout>
      <SettingDrawer
        enableDarkTheme
        getContainer={() => document.getElementById("prolayout")}
        settings={settings}
        disableUrlParams={true}
        onSettingChange={(changeSetting) => setSetting(changeSetting)}
      />
    </div>
  );
};

export default BasicLayout;
