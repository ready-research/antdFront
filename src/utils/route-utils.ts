import { i18n } from "@lingui/core";
import _ from "lodash";
import { resolvePath } from "react-router-dom";

import getIcon from "@/config/icons";
import getPage from "@/config/pages";
import type {
  DynamicRouteType,
  RouteType,
  RouteWithMenuType,
  StaticRouteType,
} from "@/config/routes";
import routeConfig from "@/config/routes";
// import { t } from "@lingui/macro";
// 单独 拉出config 因为 修改route的时候，是按"@/config/routes"的格式提供的。
// 而后端不可能提供key，resolvepath之类的参数。
// staticConfig 以 menutabs 为标志。

const normalizePathname = (pathname: string) =>
  pathname.replace(/\/+$/, "").replace(/^\/*/, "/");

const { staticConf: sc, dynamicConf: dc } = extractRouteConfig(routeConfig);
export const staticConfig = sc;
export const dynamicConfig = dc;

function extractRouteConfig(rConfig: RouteType[]): {
  staticConf: StaticRouteType[] | null;
  dynamicConf: DynamicRouteType[] | null;
} {
  if (!rConfig) return { staticConf: null, dynamicConf: null };

  let dynamicConf: DynamicRouteType[] = [];
  const copyConfig = (config: RouteType[]): StaticRouteType[] =>
    config.map((conf) => {
      const { menuTabs, children, ...restProps } = conf;
      const route: StaticRouteType = {
        ...restProps,
      };
      if (conf.children) {
        route.children = copyConfig(conf.children);
      } else {
        // 遇到menutabs 则 返回，将 静态和菜单的动态路由分开 ，由atom进行管理。
        if (!dynamicConf?.length && conf.menuTabs) {
          // 确保只添加一次。
          dynamicConf = _.cloneDeep(conf.menuTabs);
          route.menuTabs = true;
        }
      }

      return route;
    });

  return {
    staticConf: copyConfig(rConfig),
    dynamicConf: dynamicConf.length ? dynamicConf : null,
  };
}

// 抽离的congfig 去生成route config 和 menuconfig

// const rmtConfig = generateRouteWithMenuTypes(staticConfig,dynamicConf);

// 通常权限只更新menu的route 故 在此做区分。
// 基本不变的路由为 staticRoute.
// 根据用户角色改变而发生变化的为 dynamicRoute
// 两者的集合为appRoute
// Generate App Route from config files 生成 route menu tabs config

// const generateAppRouteFromConfig = (defRoutes = routeConfig) => {
//   const [rmtConfig] = generateRoute(defRoutes);

//   return rmtConfig;
// };

// const rmtConfig = generateAppRouteFromConfig

// convert menutabs to prolayout's menudataitem
// menuTabs: [
//   {
//     path: "1",
//     component: "page1"
//   },
//   {
//     path: "2",
//     component: "page2",
//     children:[
//       {
//         path: "3",
//         component: "page3"
//       },
//       {
//         path: "4",
//         component: "page4"
//       },
//     ]
//   },
// ]

// 翻译下route的Name
export function translateNameProperty(
  route: DynamicRouteType[],
): DynamicRouteType[] {
  const newRoute: DynamicRouteType[] = [];
  const transObjectName = (curRoute: DynamicRouteType) => {
    const newCurRoute = { ...curRoute };
    if (newCurRoute.name) {
      newCurRoute.name = i18n._(newCurRoute.name);
    }
    if (newCurRoute.children) {
      const newChildren: DynamicRouteType[] = [];
      newCurRoute.children.forEach((item) => {
        newChildren.push(transObjectName(item));
      });
      newCurRoute.children = newChildren;
    }
    return newCurRoute;
  };
  route.forEach((item) => {
    newRoute.push(transObjectName(item));
  });

  return newRoute;
}

function generateProlayoutMenuDataItem(
  menuTabs: DynamicRouteType[],
  basePath: string,
): DynamicRouteType[] {
  return menuTabs.map((conf) => {
    // fullPath 可去掉*号，以免引起url路径错误
    // /*的配置只会在路由  路径的末尾...
    const resPath = resolvePath(
      conf.path ? _.replace(conf.path, "/*", "") : "/*",
      normalizePathname(basePath),
    );

    const menuDataItem: DynamicRouteType = {
      // name为空则component 代替
      // 加上翻译
      name: conf.name ?? conf.component,
      // 支持大小写敏感
      caseSensitive: conf.caseSensitive,
      // 支持index route
      index: conf.index,
      // 完整路径 parentPath:/a  childrenPath:b  fullPath:/a/b
      fullPath: resPath.pathname,
      key: resPath.pathname,
      icon: getIcon(conf.icon??''),
      element: conf.component
        ? getPage(conf.component, conf.access, resPath.pathname)
        : getPage("Default"),
      access: conf.access,
    };
    // 支持prolayout路由
    if (conf.path) {
      menuDataItem.path = conf.path;
    }

    if (conf.children) {
      menuDataItem.children = generateProlayoutMenuDataItem(
        conf.children,
        resPath.pathname,
      );
    }

    return menuDataItem;
  });
}

// 根据 @/config/routes.js 里的格式，解析出全局的路由。构造好路由结构。

export function generateRouteWithMenuTypes(
  staticConf: StaticRouteType[],
  dynamicConf: DynamicRouteType[],
): {
  staticRoute: RouteWithMenuType[] | null;
  menuTabs: DynamicRouteType[] | null;
} {
  if (!staticConf || !dynamicConf) return { staticRoute: null, menuTabs: null };

  let menuTabs: DynamicRouteType[] | null = null;
  // 与prolayout 兼容的menuItem
  // name 用于配置在菜单中的名称，同时会修改为浏览器标签页标题
  // icon 代表菜单的体表，只 antd 的图表，iconfont 需要自己定义
  // locale 可以设置菜单名称的国际化表示
  // hideInMenu 会把这个路由配置在 menu 中隐藏这个路由，name 不填会有相同的效果
  // hideChildrenInMenu 会把这个路由的子节点在 menu 中隐藏

  const generateRmtConfig = (
    config: StaticRouteType[],
    basePath: string,
  ): RouteWithMenuType[] =>
    config.map((conf) => {
      // fullPath 可去掉*号，以免引起url路径错误

      // const resPath = resolvePath(_.replace(conf.path,'/*',''),normalizePathname(basePath));
      const resPath = resolvePath(
        conf.path ? _.replace(conf.path, "/*", "") : "/*",
        normalizePathname(basePath),
      );

      const route: RouteWithMenuType = {
        value: conf.component,
        // reactRouter 6 的 父子path 用来喂给react router6吃的
        // 完整路径 parentPath:/a  childrenPath:b  fullPath:/a/b
        // fullPath 可去掉*号，以免引起url路径错误
        // 支持大小写敏感
        caseSensitive: conf.caseSensitive,
        // 支持index route
        index: conf.index,
        fullPath: resPath.pathname,
        // element: conf.component,
        element: conf.component
          ? getPage(conf.component, false, resPath.pathname)
          : getPage("Default"),
        // authority: conf.authority,
        name: conf.component,
      };
      // 支持prolayout路由
      if (conf.path) {
        route.path = conf.path;
      }

      if (conf.children) {
        route.children = generateRmtConfig(conf.children, resPath.pathname);
      } else {
        // 遇到menutabs 则 返回，将 静态和菜单的动态路由分开 ，有atom进行管理。
        if (!menuTabs && conf.menuTabs) {
          // 确保只添加一次。
          menuTabs = generateProlayoutMenuDataItem(dynamicConf, basePath);
          route.menuTabs = true;
          // 将全局的和功能菜单分开。方便路由多层次嵌套
          // route.path = route.path.endsWith("/*") ? route.path : (route.path + "/*").replace("\/\/","\/");
        }
      }

      return route;
    });

  const staticRoute = generateRmtConfig(staticConf, "/");
  return { staticRoute, menuTabs };
}

// 路由拆分成了两部分，要把可变的部分 合并到新的整体中,并返回新的路由，配合react-router6的使用
// 以routeA 为基准，将routeB，拷贝至routeA里的object.menutabs=true标记的对象children属性下。使其成为一个可用的appRoute整体
export const mergeRoute = (
  routeA: RouteWithMenuType[],
  routeB: DynamicRouteType[],
  flag = "menuTabs",
): RouteWithMenuType[] => {
  let newRoute = _.cloneDeep(routeA);
  const replaceFlagPropertyByChilren = (array: RouteWithMenuType[]) =>
    array.reduce((acc: RouteWithMenuType[], element: RouteWithMenuType) => {
      const item = {
        ...element,
        children: element[flag] ? routeB : element.children,
      };

      if (!element[flag] && element.children) {
        item.children = replaceFlagPropertyByChilren(element.children);
      }

      acc.push(item);

      return acc;
    }, []);

  newRoute = replaceFlagPropertyByChilren(newRoute);
  return newRoute;
};
