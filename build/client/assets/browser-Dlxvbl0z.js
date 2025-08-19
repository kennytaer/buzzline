import{E as v,m as p,c as R,b as C,r as o,d as h}from"./index-C-5hEMXZ.js";import{i as M,d as g,e as y,s as E,g as S,f as b,h as F,j as P,R as k,k as D,l as z}from"./components-CcwgdvBG.js";/**
 * @remix-run/react v2.17.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function H(u){if(!u)return null;let m=Object.entries(u),s={};for(let[a,e]of m)if(e&&e.__type==="RouteErrorResponse")s[a]=new v(e.status,e.statusText,e.data,e.internal===!0);else if(e&&e.__type==="Error"){if(e.__subType){let i=window[e.__subType];if(typeof i=="function")try{let r=new i(e.message);r.stack=e.stack,s[a]=r}catch{}}if(s[a]==null){let i=new Error(e.message);i.stack=e.stack,s[a]=i}}else s[a]=e;return s}/**
 * @remix-run/react v2.17.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */let n,t,f=!1,c;new Promise(u=>{c=u}).catch(()=>{});function T(u){if(!t){if(window.__remixContext.future.v3_singleFetch){if(!n){let _=window.__remixContext.stream;M(_,"No stream found for single fetch decoding"),window.__remixContext.stream=void 0,n=g(_,window).then(d=>{window.__remixContext.state=d.value,n.value=!0}).catch(d=>{n.error=d})}if(n.error)throw n.error;if(!n.value)throw n}let i=y(window.__remixManifest.routes,window.__remixRouteModules,window.__remixContext.state,window.__remixContext.future,window.__remixContext.isSpaMode),r;if(!window.__remixContext.isSpaMode){r={...window.__remixContext.state,loaderData:{...window.__remixContext.state.loaderData}};let _=p(i,window.location,window.__remixContext.basename);if(_)for(let d of _){let l=d.route.id,x=window.__remixRouteModules[l],w=window.__remixManifest.routes[l];x&&E(w,x,window.__remixContext.isSpaMode)&&(x.HydrateFallback||!w.hasLoader)?r.loaderData[l]=void 0:w&&!w.hasLoader&&(r.loaderData[l]=null)}r&&r.errors&&(r.errors=H(r.errors))}t=R({routes:i,history:C(),basename:window.__remixContext.basename,future:{v7_normalizeFormMethod:!0,v7_fetcherPersist:window.__remixContext.future.v3_fetcherPersist,v7_partialHydration:!0,v7_prependBasename:!0,v7_relativeSplatPath:window.__remixContext.future.v3_relativeSplatPath,v7_skipActionErrorRevalidation:window.__remixContext.future.v3_singleFetch===!0},hydrationData:r,mapRouteProperties:h,dataStrategy:window.__remixContext.future.v3_singleFetch&&!window.__remixContext.isSpaMode?b(window.__remixManifest,window.__remixRouteModules,()=>t):void 0,patchRoutesOnNavigation:S(window.__remixManifest,window.__remixRouteModules,window.__remixContext.future,window.__remixContext.isSpaMode,window.__remixContext.basename)}),t.state.initialized&&(f=!0,t.initialize()),t.createRoutesForHMR=F,window.__remixRouter=t,c&&c(t)}let[m,s]=o.useState(void 0),[a,e]=o.useState(t.state.location);return o.useLayoutEffect(()=>{f||(f=!0,t.initialize())},[]),o.useLayoutEffect(()=>t.subscribe(i=>{i.location!==a&&e(i.location)}),[a]),P(t,window.__remixManifest,window.__remixRouteModules,window.__remixContext.future,window.__remixContext.isSpaMode),o.createElement(o.Fragment,null,o.createElement(k.Provider,{value:{manifest:window.__remixManifest,routeModules:window.__remixRouteModules,future:window.__remixContext.future,criticalCss:m,isSpaMode:window.__remixContext.isSpaMode}},o.createElement(D,{location:a},o.createElement(z,{router:t,fallbackElement:null,future:{v7_startTransition:!0}}))),window.__remixContext.future.v3_singleFetch?o.createElement(o.Fragment,null):null)}export{T as R};
