// @ts-nocheck
import{M as t}from"./fixtures-BqO7kodk.js";import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{P as r}from"./index-Co38GRlK.js";import{S as B}from"./StatusBadge-ym9Y_CSx.js";import"./_commonjsHelpers-CqkleIqs.js";function K(s){if(s<0)return"0s";const n=Math.floor(s/1e3),i=Math.floor(n/3600),a=Math.floor(n%3600/60),o=n%60;return i>0?`${i}h ${a}m`:a>0?`${a}m ${o}s`:`${o}s`}function b(s){return K(Date.now()-s)}function g({session:s,...n}){const{workspaceName:i,gitBranch:a,status:o,message:l,registeredAt:R}=s;return e.jsxs("orc-session-card",{class:"session-card","data-status":o,...n,children:[e.jsxs("div",{class:"session-card__header",children:[e.jsx("span",{class:"session-card__workspace",children:i}),e.jsx(B,{status:o})]}),e.jsxs("div",{class:"session-card__branch",children:["⎇ ",a]}),l&&e.jsx("div",{class:"session-card__message",children:l}),e.jsx("div",{class:"session-card__footer",children:e.jsxs("span",{class:"session-card__elapsed",children:[b(R)," ago"]})})]})}g.propTypes={session:r.shape({sessionId:r.string.isRequired,workspaceName:r.string.isRequired,gitBranch:r.string.isRequired,status:r.string.isRequired,message:r.string,registeredAt:r.number.isRequired}).isRequired};g.__docgenInfo={description:"",methods:[],displayName:"SessionCard",props:{session:{description:"",type:{name:"shape",value:{sessionId:{name:"string",required:!0},workspaceName:{name:"string",required:!0},gitBranch:{name:"string",required:!0},status:{name:"string",required:!0},message:{name:"string",required:!1},registeredAt:{name:"number",required:!0}}},required:!0}}};const P={title:"Orca/SessionCard",component:g},d={args:{session:t.find(s=>s.status==="working")}},c={args:{session:t.find(s=>s.status==="needs_input")}},u={args:{session:t.find(s=>s.status==="blocked")}},p={args:{session:t.find(s=>s.status==="done")}},m={args:{session:t.find(s=>s.status==="idle")}};var S,f,_;d.parameters={...d.parameters,docs:{...(S=d.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    session: MOCK_SESSIONS.find(s => s.status === 'working')
  }
}`,...(_=(f=d.parameters)==null?void 0:f.docs)==null?void 0:_.source}}};var h,O,q;c.parameters={...c.parameters,docs:{...(h=c.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    session: MOCK_SESSIONS.find(s => s.status === 'needs_input')
  }
}`,...(q=(O=c.parameters)==null?void 0:O.docs)==null?void 0:q.source}}};var I,k,x;u.parameters={...u.parameters,docs:{...(I=u.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    session: MOCK_SESSIONS.find(s => s.status === 'blocked')
  }
}`,...(x=(k=u.parameters)==null?void 0:k.docs)==null?void 0:x.source}}};var N,j,C;p.parameters={...p.parameters,docs:{...(N=p.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    session: MOCK_SESSIONS.find(s => s.status === 'done')
  }
}`,...(C=(j=p.parameters)==null?void 0:j.docs)==null?void 0:C.source}}};var M,E,w;m.parameters={...m.parameters,docs:{...(M=m.parameters)==null?void 0:M.docs,source:{originalSource:`{
  args: {
    session: MOCK_SESSIONS.find(s => s.status === 'idle')
  }
}`,...(w=(E=m.parameters)==null?void 0:E.docs)==null?void 0:w.source}}};const T=["Working","NeedsInput","Blocked","Done","Idle"];export{u as Blocked,p as Done,m as Idle,c as NeedsInput,d as Working,T as __namedExportsOrder,P as default};
