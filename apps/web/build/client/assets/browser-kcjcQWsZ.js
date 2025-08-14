import{r,E as p,i as v,e as C,f as R,m as h,s as y,g as E,h as M,k as g,l as b,n as F,o as S,R as k,p as P,q as B}from"./components-C_fFa3wo.js";/**
 * React Router v6.30.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */new Promise(()=>{});function H(t){let s={hasErrorBoundary:t.ErrorBoundary!=null||t.errorElement!=null};return t.Component&&Object.assign(s,{element:r.createElement(t.Component),Component:void 0}),t.HydrateFallback&&Object.assign(s,{hydrateFallbackElement:r.createElement(t.HydrateFallback),HydrateFallback:void 0}),t.ErrorBoundary&&Object.assign(s,{errorElement:r.createElement(t.ErrorBoundary),ErrorBoundary:void 0}),s}/**
 * @remix-run/react v2.17.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function O(t){if(!t)return null;let s=Object.entries(t),u={};for(let[n,e]of s)if(e&&e.__type==="RouteErrorResponse")u[n]=new p(e.status,e.statusText,e.data,e.internal===!0);else if(e&&e.__type==="Error"){if(e.__subType){let a=window[e.__subType];if(typeof a=="function")try{let i=new a(e.message);i.stack=e.stack,u[n]=i}catch{}}if(u[n]==null){let a=new Error(e.message);a.stack=e.stack,u[n]=a}}else u[n]=e;return u}/**
 * @remix-run/react v2.17.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */let l,o,c=!1,f;new Promise(t=>{f=t}).catch(()=>{});function z(t){if(!o){if(window.__remixContext.future.v3_singleFetch){if(!l){let d=window.__remixContext.stream;v(d,"No stream found for single fetch decoding"),window.__remixContext.stream=void 0,l=C(d,window).then(_=>{window.__remixContext.state=_.value,l.value=!0}).catch(_=>{l.error=_})}if(l.error)throw l.error;if(!l.value)throw l}let a=R(window.__remixManifest.routes,window.__remixRouteModules,window.__remixContext.state,window.__remixContext.future,window.__remixContext.isSpaMode),i;if(!window.__remixContext.isSpaMode){i={...window.__remixContext.state,loaderData:{...window.__remixContext.state.loaderData}};let d=h(a,window.location,window.__remixContext.basename);if(d)for(let _ of d){let w=_.route.id,x=window.__remixRouteModules[w],m=window.__remixManifest.routes[w];x&&y(m,x,window.__remixContext.isSpaMode)&&(x.HydrateFallback||!m.hasLoader)?i.loaderData[w]=void 0:m&&!m.hasLoader&&(i.loaderData[w]=null)}i&&i.errors&&(i.errors=O(i.errors))}o=E({routes:a,history:b(),basename:window.__remixContext.basename,future:{v7_normalizeFormMethod:!0,v7_fetcherPersist:window.__remixContext.future.v3_fetcherPersist,v7_partialHydration:!0,v7_prependBasename:!0,v7_relativeSplatPath:window.__remixContext.future.v3_relativeSplatPath,v7_skipActionErrorRevalidation:window.__remixContext.future.v3_singleFetch===!0},hydrationData:i,mapRouteProperties:H,dataStrategy:window.__remixContext.future.v3_singleFetch&&!window.__remixContext.isSpaMode?g(window.__remixManifest,window.__remixRouteModules,()=>o):void 0,patchRoutesOnNavigation:M(window.__remixManifest,window.__remixRouteModules,window.__remixContext.future,window.__remixContext.isSpaMode,window.__remixContext.basename)}),o.state.initialized&&(c=!0,o.initialize()),o.createRoutesForHMR=F,window.__remixRouter=o,f&&f(o)}let[s,u]=r.useState(void 0),[n,e]=r.useState(o.state.location);return r.useLayoutEffect(()=>{c||(c=!0,o.initialize())},[]),r.useLayoutEffect(()=>o.subscribe(a=>{a.location!==n&&e(a.location)}),[n]),S(o,window.__remixManifest,window.__remixRouteModules,window.__remixContext.future,window.__remixContext.isSpaMode),r.createElement(r.Fragment,null,r.createElement(k.Provider,{value:{manifest:window.__remixManifest,routeModules:window.__remixRouteModules,future:window.__remixContext.future,criticalCss:s,isSpaMode:window.__remixContext.isSpaMode}},r.createElement(P,{location:n},r.createElement(B,{router:o,fallbackElement:null,future:{v7_startTransition:!0}}))),window.__remixContext.future.v3_singleFetch?r.createElement(r.Fragment,null):null)}export{z as R};
