import{j as t}from"./jsx-runtime-D_zvdyIk.js";import{S as p}from"./StatusBadge-ym9Y_CSx.js";import"./index-Co38GRlK.js";import"./_commonjsHelpers-CqkleIqs.js";const m={title:"Orca/StatusBadge",component:p},n=["registered","working","idle","blocked","needs_input","done"],s={render:()=>t.jsx("div",{style:{display:"flex",gap:"8px",flexWrap:"wrap"},children:n.map(e=>t.jsx(p,{status:e},e))})};var a,r,o;s.parameters={...s.parameters,docs:{...(a=s.parameters)==null?void 0:a.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  }}>
      {statuses.map(s => <StatusBadge key={s} status={s} />)}
    </div>
}`,...(o=(r=s.parameters)==null?void 0:r.docs)==null?void 0:o.source}}};const c=["AllStatuses"];export{s as AllStatuses,c as __namedExportsOrder,m as default};
