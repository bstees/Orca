import{M as o}from"./fixtures-C_gQGTI9.js";import{j as t}from"./jsx-runtime-D_zvdyIk.js";import{P as e}from"./index-Co38GRlK.js";import"./_commonjsHelpers-CqkleIqs.js";function h({sessions:s,alerts:W=[],selectedOption:g=null,onOptionSelect:E=()=>{},...C}){var f;const a=s.filter(r=>r.status==="needs_input"||r.status==="blocked"),i=s.filter(r=>r.status==="done"),n=W[0]??null;if(!a.length&&!n&&!i.length)return null;n||a.length;const T=n?n.message:a.length===1?`${a[0].workspaceName} needs your input`:a.length>1?`${a.length} sessions need your input`:i.length===1?`${i[0].workspaceName} finished`:`${i.length} sessions finished`;return t.jsxs("orc-alert-banner",{className:"alert-banner",...C,children:[t.jsx("span",{className:"alert-banner__icon",children:"🔔"}),t.jsx("span",{className:"alert-banner__text",children:T}),((f=n==null?void 0:n.options)==null?void 0:f.length)>0&&t.jsx("span",{className:"alert-banner__options",children:n.options.map(r=>t.jsx("button",{type:"button",className:"alert-banner__option",onClick:()=>E(n.sessionId,r),disabled:g!=null,children:r},r))}),g&&t.jsxs("span",{className:"alert-banner__response",children:["You selected: ",g]})]})}h.propTypes={sessions:e.arrayOf(e.shape({sessionId:e.string.isRequired,workspaceName:e.string.isRequired,status:e.string.isRequired})).isRequired,alerts:e.arrayOf(e.shape({sessionId:e.string.isRequired,message:e.string.isRequired,options:e.arrayOf(e.string)})),selectedOption:e.string,onOptionSelect:e.func};h.__docgenInfo={description:"",methods:[],displayName:"AlertBanner",props:{alerts:{defaultValue:{value:"[]",computed:!1},description:"",type:{name:"arrayOf",value:{name:"shape",value:{sessionId:{name:"string",required:!0},message:{name:"string",required:!0},options:{name:"arrayOf",value:{name:"string"},required:!1}}}},required:!1},selectedOption:{defaultValue:{value:"null",computed:!1},description:"",type:{name:"string"},required:!1},onOptionSelect:{defaultValue:{value:"() => {}",computed:!1},description:"",type:{name:"func"},required:!1},sessions:{description:"",type:{name:"arrayOf",value:{name:"shape",value:{sessionId:{name:"string",required:!0},workspaceName:{name:"string",required:!0},status:{name:"string",required:!0}}}},required:!0}}};const Y={title:"Orca/AlertBanner",component:h},m=o.filter(s=>s.status==="needs_input"),$=o.filter(s=>s.status==="blocked"),K=o.filter(s=>s.status==="working"),l={args:{sessions:m}},u={args:{sessions:[...m,...$]}},c={args:{sessions:K}},d={args:{sessions:o.filter(s=>s.status==="done")}};var k,I;const p={args:{sessions:o,alerts:[{sessionId:(k=m[0])==null?void 0:k.sessionId,workspaceName:(I=m[0])==null?void 0:I.workspaceName,message:"Which approach should I use for auth?",options:["JWT","Sessions","OAuth"]}]}};var N,S,O;l.parameters={...l.parameters,docs:{...(N=l.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    sessions: needsInput
  }
}`,...(O=(S=l.parameters)==null?void 0:S.docs)==null?void 0:O.source}}};var _,b,q;u.parameters={...u.parameters,docs:{...(_=u.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    sessions: [...needsInput, ...blocked]
  }
}`,...(q=(b=u.parameters)==null?void 0:b.docs)==null?void 0:q.source}}};var y,x,w;c.parameters={...c.parameters,docs:{...(y=c.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    sessions: working
  }
}`,...(w=(x=c.parameters)==null?void 0:x.docs)==null?void 0:w.source}}};var j,v,B;d.parameters={...d.parameters,docs:{...(j=d.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    sessions: MOCK_SESSIONS.filter(s => s.status === 'done')
  }
}`,...(B=(v=d.parameters)==null?void 0:v.docs)==null?void 0:B.source}}};var A,R,M;p.parameters={...p.parameters,docs:{...(A=p.parameters)==null?void 0:A.docs,source:{originalSource:`{
  args: {
    sessions: MOCK_SESSIONS,
    alerts: [{
      sessionId: needsInput[0]?.sessionId,
      workspaceName: needsInput[0]?.workspaceName,
      message: 'Which approach should I use for auth?',
      options: ['JWT', 'Sessions', 'OAuth']
    }]
  }
}`,...(M=(R=p.parameters)==null?void 0:R.docs)==null?void 0:M.source}}};const z=["OneNeedsInput","MultipleBlocking","NoneBlocking","Finished","WithAlerts"];export{d as Finished,u as MultipleBlocking,c as NoneBlocking,l as OneNeedsInput,p as WithAlerts,z as __namedExportsOrder,Y as default};
