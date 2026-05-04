// @ts-nocheck
import{M as l}from"./fixtures-BqO7kodk.js";import{j as a}from"./jsx-runtime-D_zvdyIk.js";import{P as s}from"./index-Co38GRlK.js";import"./_commonjsHelpers-CqkleIqs.js";function d({sessions:e,alerts:B=[],...j}){var m;const t=e.filter(n=>n.status==="needs_input"||n.status==="blocked"),r=B[0]??null;if(!t.length&&!r)return null;const A=r?r.message:t.length===1?`${t[0].workspaceName} needs your input`:`${t.length} sessions need your input`;return a.jsxs("orc-alert-banner",{class:"alert-banner",...j,children:[a.jsx("span",{class:"alert-banner__icon",children:"🔔"}),a.jsx("span",{class:"alert-banner__text",children:A}),((m=r==null?void 0:r.options)==null?void 0:m.length)>0&&a.jsx("span",{class:"alert-banner__options",children:r.options.map(n=>a.jsx("button",{class:"alert-banner__option",children:n},n))})]})}d.propTypes={sessions:s.arrayOf(s.shape({sessionId:s.string.isRequired,workspaceName:s.string.isRequired,status:s.string.isRequired})).isRequired,alerts:s.arrayOf(s.shape({sessionId:s.string.isRequired,message:s.string.isRequired,options:s.arrayOf(s.string)}))};d.__docgenInfo={description:"",methods:[],displayName:"AlertBanner",props:{alerts:{defaultValue:{value:"[]",computed:!1},description:"",type:{name:"arrayOf",value:{name:"shape",value:{sessionId:{name:"string",required:!0},message:{name:"string",required:!0},options:{name:"arrayOf",value:{name:"string"},required:!1}}}},required:!1},sessions:{description:"",type:{name:"arrayOf",value:{name:"shape",value:{sessionId:{name:"string",required:!0},workspaceName:{name:"string",required:!0},status:{name:"string",required:!0}}}},required:!0}}};const C={title:"Orca/AlertBanner",component:d},c=l.filter(e=>e.status==="needs_input"),R=l.filter(e=>e.status==="blocked"),v=l.filter(e=>e.status==="working"),o={args:{sessions:c}},i={args:{sessions:[...c,...R]}},u={args:{sessions:v}};var g,h;const p={args:{sessions:l,alerts:[{sessionId:(g=c[0])==null?void 0:g.sessionId,workspaceName:(h=c[0])==null?void 0:h.workspaceName,message:"Which approach should I use for auth?",options:["JWT","Sessions","OAuth"]}]}};var f,I,k;o.parameters={...o.parameters,docs:{...(f=o.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    sessions: needsInput
  }
}`,...(k=(I=o.parameters)==null?void 0:I.docs)==null?void 0:k.source}}};var _,O,q;i.parameters={...i.parameters,docs:{...(_=i.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    sessions: [...needsInput, ...blocked]
  }
}`,...(q=(O=i.parameters)==null?void 0:O.docs)==null?void 0:q.source}}};var N,S,y;u.parameters={...u.parameters,docs:{...(N=u.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    sessions: working
  }
}`,...(y=(S=u.parameters)==null?void 0:S.docs)==null?void 0:y.source}}};var b,x,w;p.parameters={...p.parameters,docs:{...(b=p.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    sessions: MOCK_SESSIONS,
    alerts: [{
      sessionId: needsInput[0]?.sessionId,
      workspaceName: needsInput[0]?.workspaceName,
      message: 'Which approach should I use for auth?',
      options: ['JWT', 'Sessions', 'OAuth']
    }]
  }
}`,...(w=(x=p.parameters)==null?void 0:x.docs)==null?void 0:w.source}}};const J=["OneNeedsInput","MultipleBlocking","NoneBlocking","WithAlerts"];export{i as MultipleBlocking,u as NoneBlocking,o as OneNeedsInput,p as WithAlerts,J as __namedExportsOrder,C as default};
