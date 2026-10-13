var Uf=Object.defineProperty;var zt=(i,e)=>()=>(i&&(e=i(i=0)),e);var Ar=(i,e)=>{for(var t in e)Uf(i,t,{get:e[t],enumerable:!0})};function fy(i){let e=[i[0],i[4],i[8]],t=e[0]+e[1]+e[2],n=[e[0],e[1],e[2],t],s=0;for(let d=1;d<4;d++)n[d]>n[s]&&(s=d);let r=[0,0,0,0];if(s!==3){let d=s,u=(d+1)%3,f=(u+1)%3;r[d]=1-n[3]+2*i[d*3+d],r[u]=i[u*3+d]+i[d*3+u],r[f]=i[f*3+d]+i[d*3+f],r[3]=i[f*3+u]-i[u*3+f]}else r[0]=i[7]-i[5],r[1]=i[2]-i[6],r[2]=i[3]-i[1],r[3]=1+n[3];let o=Math.hypot(r[0],r[1],r[2],r[3]),[a,c,l,h]=[r[0]/o,r[1]/o,r[2]/o,r[3]/o];return h<0&&([a,c,l,h]=[-a,-c,-l,-h]),[h,a,c,l]}function ud(i){let[e,t,n,s]=fy(i),r=Math.hypot(t,n,s);if(r<1e-12)return[0,0,0];let a=2*Math.atan2(r,e)/r;return[t*a,n*a,s*a]}function vl(i){let e=[0,0,0,0],t=i[0]+i[4]+i[8];t>0?(e[0]=1+t,e[1]=i[7]-i[5],e[2]=i[2]-i[6],e[3]=i[3]-i[1]):i[0]>i[4]&&i[0]>i[8]?(e[1]=1+i[0]-i[4]-i[8],e[0]=i[7]-i[5],e[2]=i[1]+i[3],e[3]=i[2]+i[6]):i[4]>i[8]?(e[2]=1-i[0]+i[4]-i[8],e[0]=i[2]-i[6],e[1]=i[1]+i[3],e[3]=i[5]+i[7]):(e[3]=1-i[0]-i[4]+i[8],e[0]=i[3]-i[1],e[1]=i[2]+i[6],e[2]=i[5]+i[7]);let n=Math.hypot(...e);return[e[0]/n,e[1]/n,e[2]/n,e[3]/n]}function dd(i,e){return[i[0]*e[0]-i[1]*e[1]-i[2]*e[2]-i[3]*e[3],i[0]*e[1]+i[1]*e[0]+i[2]*e[3]-i[3]*e[2],i[0]*e[2]-i[1]*e[3]+i[2]*e[0]+i[3]*e[1],i[0]*e[3]+i[1]*e[2]-i[2]*e[1]+i[3]*e[0]]}function cd(i){let e=i.rows,t=i.cols,n=new kt(e,t,Float64Array.from(i.data)),s=kt.eye(t);for(let o=0;o<60;o++){let a=!1;for(let c=0;c<t-1;c++)for(let l=c+1;l<t;l++){let h=0,d=0,u=0;for(let p=0;p<e;p++){let x=n.data[p*t+c],R=n.data[p*t+l];h+=x*x,d+=R*R,u+=x*R}if(Math.abs(u)<=1e-15*Math.sqrt(h*d)||u===0)continue;a=!0;let f=(d-h)/(2*u),g=Math.sign(f||1)/(Math.abs(f)+Math.sqrt(1+f*f)),b=1/Math.sqrt(1+g*g),m=b*g;for(let p=0;p<e;p++){let x=n.data[p*t+c],R=n.data[p*t+l];n.data[p*t+c]=b*x-m*R,n.data[p*t+l]=m*x+b*R}for(let p=0;p<t;p++){let x=s.data[p*t+c],R=s.data[p*t+l];s.data[p*t+c]=b*x-m*R,s.data[p*t+l]=m*x+b*R}}if(!a)break}let r=new Float64Array(t);for(let o=0;o<t;o++){let a=0;for(let c=0;c<e;c++)a+=n.data[c*t+o]**2;if(r[o]=Math.sqrt(a),r[o]>1e-300)for(let c=0;c<e;c++)n.data[c*t+o]/=r[o]}return{U:n,s:r,V:s}}function wa(i){if(i.rows>=i.cols)return cd(i);let e=cd(i.T());return{U:e.V,s:e.s,V:e.U}}var ld,dy,Nn,ai,Mt,fn,ls,Ti,Ma,hd,kt,fd,Un=zt(()=>{"use strict";ld=(i,e)=>[i[0]-e[0],i[1]-e[1],i[2]-e[2]],dy=(i,e)=>[i[0]*e,i[1]*e,i[2]*e],Nn=(i,e)=>i[0]*e[0]+i[1]*e[1]+i[2]*e[2],ai=(i,e)=>[i[1]*e[2]-i[2]*e[1],i[2]*e[0]-i[0]*e[2],i[0]*e[1]-i[1]*e[0]],Mt=i=>Math.hypot(i[0],i[1],i[2]),fn=i=>{let e=Mt(i);return e>0?dy(i,1/e):[i[0],i[1],i[2]]},ls=(i,e)=>[i[0]*e[0]+i[1]*e[1]+i[2]*e[2],i[3]*e[0]+i[4]*e[1]+i[5]*e[2],i[6]*e[0]+i[7]*e[1]+i[8]*e[2]],Ti=(i,e)=>[i[0]*e[0]+i[3]*e[1]+i[6]*e[2],i[1]*e[0]+i[4]*e[1]+i[7]*e[2],i[2]*e[0]+i[5]*e[1]+i[8]*e[2]],Ma=(i,e)=>[i[e],i[3+e],i[6+e]],hd=(i,e)=>{let t=new Array(9).fill(0);for(let n=0;n<3;n++)for(let s=0;s<3;s++)for(let r=0;r<3;r++)t[n*3+s]+=i[n*3+r]*e[s*3+r];return t};kt=class i{constructor(e,t,n=new Float64Array(e*t)){this.rows=e;this.cols=t;this.data=n}static eye(e){let t=new i(e,e);for(let n=0;n<e;n++)t.data[n*e+n]=1;return t}static fromRows(e){let t=new i(e.length,e[0]?.length??0);return e.forEach((n,s)=>t.data.set(Array.from(n),s*t.cols)),t}get(e,t){return this.data[e*this.cols+t]}set(e,t,n){this.data[e*this.cols+t]=n}mul(e){let t=new i(this.rows,e.cols);for(let n=0;n<this.rows;n++)for(let s=0;s<this.cols;s++){let r=this.data[n*this.cols+s];if(r!==0)for(let o=0;o<e.cols;o++)t.data[n*e.cols+o]+=r*e.data[s*e.cols+o]}return t}mulVec(e){let t=new Float64Array(this.rows);for(let n=0;n<this.rows;n++){let s=0;for(let r=0;r<this.cols;r++)s+=this.data[n*this.cols+r]*e[r];t[n]=s}return t}sub(e){let t=new i(this.rows,this.cols);for(let n=0;n<t.data.length;n++)t.data[n]=this.data[n]-e.data[n];return t}T(){let e=new i(this.cols,this.rows);for(let t=0;t<this.rows;t++)for(let n=0;n<this.cols;n++)e.data[n*this.rows+t]=this.data[t*this.cols+n];return e}static vstack(e){let t=e[0].cols,n=e.reduce((o,a)=>o+a.rows,0),s=new i(n,t),r=0;for(let o of e)s.data.set(o.data,r),r+=o.data.length;return s}};fd=(i,e)=>{let t=0;for(let n of i)t+=n*n;return t=Math.sqrt(t),t<=e||t===0?i:i.map(n=>n*(e/t))}});function ci(i,e){let t=i.state.tcp_rot;switch(e){case"eef_x":case"eef_x_axis":return Ma(t,0);case"eef_y":case"eef_y_axis":return Ma(t,1);case"eef_z":case"eef_z_axis":return Ma(t,2);case"world_z":case"z":return[0,0,1];case"world_x":case"x":return[1,0,0];case"world_y":case"y":return[0,1,0]}if(e.includes("__to__")){let[n,s]=e.split("__to__",2),r=i.keypoints[n],o=i.keypoints[s];if(!r||!o)throw new hs(`vector '${e}': keypoint missing`);let a=[o.pos[0]-r.pos[0],o.pos[1]-r.pos[1],o.pos[2]-r.pos[2]];if(Mt(a)<1e-6)throw new hs(`vector '${e}' has zero length`);return fn(a)}for(let n of["_normal","_norm"])if(e.endsWith(n)){let s=i.keypoints[e.slice(0,-n.length)];if(s&&s.normal)return s.normal}if(e.endsWith("_axis")){let n=i.keypoints[e.slice(0,-5)];if(n&&n.axis)return n.axis}throw new hs(`unknown vector '${e}'`)}function Sl(i){let e=Math.abs(i[0])<.9?[1,0,0]:[0,1,0],t=fn(ai(i,e)),n=ai(i,t);return[t,n]}function py(i,e){let t=new kt(2,e.cols);for(let n=0;n<2;n++)for(let s=0;s<e.cols;s++)t.data[n*e.cols+s]=i[n][0]*e.data[s]+i[n][1]*e.data[e.cols+s]+i[n][2]*e.data[2*e.cols+s];return t}function Ml(i,e){let t=e.startsWith("-")?-1:1,n=ci(i,e.replace(/^[-+]+/,""));return[t*n[0],t*n[1],t*n[2]]}function yy(i,e,t=.001){let{U:n,s,V:r}=wa(i),o=i.cols,a=i.rows,c=new kt(o,a),l=new kt(o,o);for(let h=0;h<s.length;h++){let d=s[h];if(d>1e-12){let u=d/(d*d+e*e);for(let f=0;f<o;f++)for(let g=0;g<a;g++)c.data[f*a+g]+=r.data[f*r.cols+h]*u*n.data[g*n.cols+h]}if(d>t)for(let u=0;u<o;u++)for(let f=0;f<o;f++)l.data[u*o+f]+=r.data[u*r.cols+h]*r.data[f*r.cols+h]}return{P:c,rowSpace:l}}function _d(i,e,t,n=null,s=.5,r=1.5){let o=kt.eye(e),a=new Float64Array(e);for(let l of i){if(!l.length)continue;let h=kt.vstack(l.map(x=>x.J)),d=[];for(let x of l){let R=new Float64Array(x.e.length);for(let S=0;S<R.length;S++)R[S]=x.gain*x.e[S];d.push(...fd(R,x.v_max))}let u=h.mul(o),{P:f,rowSpace:g}=yy(u,t),b=h.mulVec(a),m=new Float64Array(d.length);for(let x=0;x<m.length;x++)m[x]=d[x]-b[x];let p=f.mulVec(m);a=a.map((x,R)=>x+p[R]),o=o.sub(g)}if(n){let l=new Float64Array(e);for(let d=0;d<e;d++)l[d]=s*n[d];let h=o.mulVec(l);a=a.map((d,u)=>d+h[u])}let c=0;for(let l of a)c=Math.max(c,Math.abs(l));return c<=r?a:a.map(l=>l*(r/c))}function yd(i=.08,e=!0){let t=xy;if(!e){let n=t.indexOf("Force(axis, value)"),s=t.indexOf("Gripper(action)");t=t.slice(0,n)+`Force: NOT AVAILABLE on this robot (no force sensor). Lower onto surfaces with a small PosAlign z offset instead.

`+t.slice(s)}return t.replace("{max_width}",String(Number(i.toPrecision(6))))}function xd(i,e){let t=s=>{if(i.param===null){if(s===void 0)throw new Error(`${i.type} needs a parameter`);return s}return e[i.param]},n=s=>s*Math.PI/180;switch(i.type){case"PosAlign":return new sr(i.source,i.target,i.axis??"z",t(0),i.priority,i.stage);case"AxisAlign":return new wl(i.source,i.target,n(t(180)),i.priority,i.stage);case"YawAlign":return new Tl(i.source,i.target,n(t(90)),i.priority,i.stage);case"Force":return new Al(i.axis??"-z",t(3),i.priority,i.stage);case"Gripper":return new Ri(i.action??"open",i.param?e[i.param]??null:null,i.priority,i.stage)}}function Ai(i){if(!i||bd.has(i))return null;for(let e of by)if(i.endsWith(e))return i.slice(0,-e.length);return i}function Rl(i){if(!i||bd.has(i))return[];if(i.includes("__to__")){let[t,n]=i.split("__to__",2);return[Ai(t),Ai(n)].filter(s=>!!s)}let e=Ai(i);return e?[e]:[]}function li(i){let e=[];for(let t of i)for(let n of[t.source,t.target])for(let s of Rl(n))e.includes(s)||e.push(s);return e}var md,hs,Ei,rr,gd,El,sr,wl,pd,my,Tl,gy,_y,Al,Ri,xy,bd,by,us=zt(()=>{"use strict";Un();md=(i,e,t=null,n=null,s=180)=>({name:i,pos:e,normal:t,axis:n,axis_sym:s}),hs=class extends Error{};Ei=class{priority=1;stage=0;onStageStart(e){}gripperCommand(){return null}describe(){return this.name}},rr=(i,e,t=!1)=>(t&&i>=0?"+":"")+i.toFixed(e),gd=i=>i*180/Math.PI;El=(i,e)=>{let t=new kt(1,e.cols);for(let n=0;n<e.cols;n++)t.data[n]=i[0]*e.data[n]+i[1]*e.data[e.cols+n]+i[2]*e.data[2*e.cols+n];return t};sr=class extends Ei{constructor(t,n,s,r,o=1,a=0){super();this.source=t;this.target=n;this.axis=s;this.offset=r;this.priority=o,this.stage=a}name="PosAlign";rTcp=[0,0,0];targetPos=[0,0,0];onStageStart(t){let n=t.state;if(this.source==="eef_tcp")this.rTcp=[0,0,0];else{let s=t.keypoints[this.source].pos;this.rTcp=Ti(n.tcp_rot,[s[0]-n.tcp_pos[0],s[1]-n.tcp_pos[1],s[2]-n.tcp_pos[2]])}this.targetPos=this.target==="eef_tcp"?[...n.tcp_pos]:[...t.keypoints[this.target].pos]}sourceNow(t){let n=t.state.tcp_rot,s=this.rTcp,r=t.state.tcp_pos;return[r[0]+n[0]*s[0]+n[1]*s[1]+n[2]*s[2],r[1]+n[3]*s[0]+n[4]*s[1]+n[5]*s[2],r[2]+n[6]*s[0]+n[7]*s[1]+n[8]*s[2]]}error(t){let n=Ml(t,this.axis),s=this.sourceNow(t),r=this.targetPos;return{n,e:n[0]*(r[0]-s[0])+n[1]*(r[1]-s[1])+n[2]*(r[2]-s[2])+this.offset,p:s}}term(t){let{n,e:s,p:r}=this.error(t),[o]=t.robot.jacobian(r),a=t.cfg.execution;return{J:El(n,o),e:new Float64Array([s]),gain:a.pos_gain,v_max:a.max_lin_speed}}finished(t){return Math.abs(this.error(t).e)<t.cfg.execution.pos_tol}describe(){return`PosAlign(${this.source}, ${this.target}, axis=${this.axis}, offset=${rr(this.offset,3,!0)} m)`}},wl=class extends Ei{constructor(t,n,s,r=1,o=0){super();this.source=t;this.target=n;this.angle=s;this.priority=r,this.stage=o}name="AxisAlign";targetVec=null;onStageStart(t){this.target.startsWith("eef")||(this.targetVec=[...ci(t,this.target)])}rotError(t){let n=ci(t,this.source),s=this.targetVec??ci(t,this.target),r=Nn(n,s),o=[n[0]-r*s[0],n[1]-r*s[1],n[2]-r*s[2]];Mt(o)<1e-6&&(o=Sl(s)[0]),o=fn(o);let a=Math.cos(this.angle),c=Math.sin(this.angle),l=[a*s[0]+c*o[0],a*s[1]+c*o[1],a*s[2]+c*o[2]],h=ai(n,l),d=Mt(h),u=Math.atan2(d,Nn(n,l)),f=d>1e-8?[h[0]/d,h[1]/d,h[2]/d]:Sl(n)[0];return{u:n,e3:[u*f[0],u*f[1],u*f[2]],phi:u}}term(t){let{u:n,e3:s}=this.rotError(t),r=Sl(n),[,o]=t.robot.jacobian(t.state.tcp_pos),a=t.cfg.execution;return{J:py(r,o),e:new Float64Array([Nn(r[0],s),Nn(r[1],s)]),gain:a.ang_gain,v_max:a.max_ang_speed}}finished(t){return this.rotError(t).phi<t.cfg.execution.ang_tol}describe(){return`AxisAlign(${this.source}, ${this.target}, angle=${rr(gd(this.angle),0)} deg)`}},pd=[0,0,1],my=(i,e)=>{let t=(i+e/2)%e;return(t<0?t+e:t)-e/2},Tl=class extends Ei{constructor(t,n,s,r=2,o=0){super();this.source=t;this.target=n;this.angle=s;this.priority=r,this.stage=o}name="YawAlign";t=null;sym=180;onStageStart(t){try{this.t=[...ci(t,this.target)]}catch(s){if(!(s instanceof hs))throw s;this.t=null;return}let n=this.target.endsWith("_axis")?t.keypoints[this.target.slice(0,-5)]:void 0;this.sym=n?n.axis_sym:180}err(t){if(!this.t)return 0;let n=[...ci(t,this.source)];n[2]=0;let s=[this.t[0],this.t[1],0];if(Mt(n)<1e-6||Mt(s)<1e-6)return 0;n=fn(n);let r=fn(s),o=Math.atan2(Nn(pd,ai(n,r)),Nn(n,r));return my(o-this.angle,this.sym*Math.PI/180)}term(t){if(!this.t)return null;let[,n]=t.robot.jacobian(t.state.tcp_pos),s=t.cfg.execution;return{J:El(pd,n),e:new Float64Array([this.err(t)]),gain:s.ang_gain,v_max:s.max_ang_speed}}finished(t){return Math.abs(this.err(t))<t.cfg.execution.ang_tol}describe(){return`YawAlign(${this.source}, ${this.target}, angle=${rr(gd(this.angle),0)} deg)`}},gy=.2,_y=3,Al=class extends Ei{constructor(t,n,s=1,r=0){super();this.axis=t;this.value=n;this.priority=s,this.stage=r}name="Force";acc=[];bias=null;hits=0;contact=!1;reset(){this.acc=[],this.bias=null,this.hits=0,this.contact=!1}onStageStart(t){this.reset()}delta(t){let n=Ml(t,this.axis),s=t.state.wrench,r=this.bias;return Math.abs(n[0]*(s[0]-r[0])+n[1]*(s[1]-r[1])+n[2]*(s[2]-r[2]))}update(t){if(this.contact)return;let n=t.state.wrench.slice(0,3);if(t.t_stage<gy){this.acc.push(n);return}this.bias===null&&(this.bias=this.acc.length?[0,1,2].map(s=>this.acc.reduce((r,o)=>r+o[s],0)/this.acc.length):n),this.hits=this.delta(t)>=this.value?this.hits+1:0,this.contact=this.hits>=_y}term(t){if(this.update(t),this.contact||this.bias===null)return null;let n=Ml(t,this.axis),[s]=t.robot.jacobian(t.state.tcp_pos),r=t.cfg.execution.force_approach_speed;return{J:El(n,s),e:new Float64Array([1]),gain:r,v_max:r}}finished(t){return this.contact}describe(){return`Force(axis=${this.axis}, contact>=${rr(this.value,1)} N)`}},Ri=class extends Ei{constructor(t="open",n=null,s=1,r=0){super();this.action=t;this.given=n;this.width=t==="close"?0:n,this.priority=s,this.stage=r}name="Gripper";width;prevW=null;still=0;onStageStart(t){this.prevW=null,this.still=0,(this.action==="open"||this.width===null)&&(this.width=this.given===null||this.action==="open"?t.robot.max_width:this.given)}gripperCommand(){return this.width}term(){return null}finished(t){let n=t.state.gripper_width;return this.prevW!==null&&Math.abs(n-this.prevW)<1e-4?this.still++:this.still=0,this.prevW=n,t.t_stage>.3&&this.still>=8}describe(){return`Gripper(${this.action}`+(this.width!==null?`, width=${rr(this.width,3)} m)`:")")}};xy="Controller library (all controllers run simultaneously inside a stage; stages run in order).\n\nPosAlign(source, target, axis, offset)\n  Moves the point `source` so that, along task axis `axis`, it sits `offset` metres from `target`\n  (n . p_source = n . p_target + offset). `axis` is one of x, y, z (world axes; z is up).\n  `source` is the point the robot moves: either eef_tcp (the gripper's fingertip centre) or an object\n  keypoint that is currently held in the gripper. `target` is a static point: an object keypoint, or\n  eef_tcp (= where the gripper is at the start of the stage, useful for relative moves).\n  To reach a 3D position you use three PosAlign controllers (x, y, z).\n  offset parameter names: o_x, o_y, o_z (metres). Positive offset = source ABOVE / beyond target.\n\nAxisAlign(source, target, angle)\n  Rotates so that the angle between the direction vectors `source` and `target` equals `angle`\n  (degrees). Vectors: eef_z (direction the gripper points; the fingers point along +eef_z),\n  or <keypoint>_normal (surface normal of a grounded keypoint, pointing away from the surface),\n  or <A>__to__<B> (the direction from keypoint A to keypoint B, e.g. bottle_body_center__to__bottle_cap_end = the\n  long axis of a bottle lying on the table; both keypoints get grounded).\n  angle 180 makes them anti-parallel. To point the gripper STRAIGHT DOWN use AxisAlign(eef_z, world_z, 180): this is the\n  robust choice (world_z is the exact up vector). Use <keypoint>_normal only for a genuinely tilted flat surface; the\n  measured normal of a curved surface (a cylinder lying down, a ball) is unreliable. Parameter name: o_theta (degrees).\n\nYawAlign(source, target, angle)\n  Turns the gripper about the vertical so that the direction `source` (eef_y = the direction along which the\n  fingers open and close) makes `angle` degrees with the horizontal edge direction `target` = <keypoint>_axis\n  of that keypoint's top face, or `target` = <A>__to__<B> (any two keypoints; only its horizontal direction\n  counts). angle 90 = fingers close across the edge = grasp the flat sides of a box-like\n  object. Square faces are treated as 90 degree symmetric. Needed for boxy objects (cubes); NOT needed for\n  round ones (bottles). Parameter name: o_yaw (degrees). Use priority 2 together with AxisAlign.\n\nForce(axis, value)\n  Guarded move: creeps along `axis` (x, y, z, or negative like -z) until a contact force of `value`\n  newtons is felt at the wrist. Use it to lower something until it touches a surface.\n  Parameter name: f (newtons, typically 2-5).\n\nGripper(action)\n  action = open | close | width. `open` releases, `close` grasps whatever is between the fingers,\n  `width` sets an explicit opening in metres (parameter name g). Max opening {max_width} m.\n\nRelative moves: PosAlign(eef_tcp, eef_tcp, axis, offset) moves the gripper by `offset` along `axis` from where it is\nwhen the stage starts (lift, retract, sideways push). With the gripper closed this is how an object is pushed.\n\nPriorities: controllers with a smaller `priority` number take precedence (null-space projection);\nuse the same number for controllers that should be equally important (typically all PosAlign of a\nstage share priority 1; orientation AxisAlign gets priority 2 unless orientation is critical).\nStages: `stage` 0,1,2... run one after another; a stage ends when all its controllers converged.\nUse a later stage when one action must finish before another starts (e.g. open the gripper THEN retract).\n";bd=new Set(["eef_tcp","eef_x","eef_y","eef_z","eef_x_axis","eef_y_axis","eef_z_axis","world_x","world_y","world_z","x","y","z"]),by=["_normal","_norm","_axis"]});function Fn(i,e,t=!0){return{json:i,parse:e,required:t}}function ar(i,e,t){return{name:i,description:e,jsonSchema:t.json,parse:n=>t.parse(n,"")}}var Ie,vd,or,hi,Se,vy,Sy,Sd,Md,My,wy,wd,Ty,Ay,Ey,Td,Ry,Cy,Ad,Py,Iy,Ed,ZM,Cl,ds,fs,cr=zt(()=>{"use strict";Ie=class extends Error{},vd=i=>!!i&&typeof i=="object"&&!Array.isArray(i);or=(i,e)=>({json:{...i.json,default:e},required:!1,parse:(t,n)=>t==null?structuredClone(e):i.parse(t,n)}),hi=(i,e)=>e?{...i,json:{...i.json,description:e}}:i,Se={string:(i,e)=>{let t=hi(Fn({type:"string"},(n,s)=>{if(typeof n!="string")throw new Ie(`${s}: expected a string`);return n}),i);return e===void 0?t:or(t,e)},number:i=>hi(Fn({type:"number"},(e,t)=>{if(typeof e!="number"||!Number.isFinite(e))throw new Ie(`${t}: expected a number`);return e}),i),int:(i,e)=>{let t=hi(Fn({type:"integer"},(n,s)=>{if(typeof n!="number"||!Number.isInteger(n))throw new Ie(`${s}: expected an integer`);return n}),i);return e===void 0?t:or(t,e)},bool:(i,e)=>{let t=hi(Fn({type:"boolean"},(n,s)=>{if(typeof n!="boolean")throw new Ie(`${s}: expected true or false`);return n}),i);return e===void 0?t:or(t,e)},enum:i=>Fn({type:"string",enum:[...i]},(e,t)=>{if(!i.includes(e))throw new Ie(`${t}: must be one of ${i.join(", ")}`);return e}),nullable:(i,e)=>hi(Fn({anyOf:[i.json,{type:"null"}],default:null},(t,n)=>t==null?null:i.parse(t,n),!1),e),array:(i,e,t=!1)=>{let n=hi(Fn({type:"array",items:i.json},(s,r)=>{if(!Array.isArray(s))throw new Ie(`${r}: expected a list`);return s.map((o,a)=>i.parse(o,`${r}[${a}]`))}),e);return t?or(n,[]):n},record:i=>hi(Fn({type:"object",additionalProperties:{type:"string"}},(e,t)=>{if(!vd(e))throw new Ie(`${t}: expected an object`);let n={};for(let[s,r]of Object.entries(e)){if(typeof r!="string")throw new Ie(`${t}.${s}: expected a string`);n[s]=r}return n}),i),object:(i,e)=>hi(Fn({type:"object",properties:Object.fromEntries(Object.entries(i).map(([t,n])=>[t,n.json])),required:Object.entries(i).filter(([,t])=>t.required).map(([t])=>t)},(t,n)=>{if(!vd(t))throw new Ie(`${n||"answer"}: expected an object`);let s={};for(let[r,o]of Object.entries(i)){let a=t[r];if(a===void 0&&o.required)throw new Ie(`${n?n+".":""}${r}: field required`);s[r]=o.parse(a,`${n?n+".":""}${r}`)}return s}),e)};vy=Se.object({id:Se.int("1-based order of execution"),name:Se.string("short imperative name, e.g. 'Grasp the bottle'"),description:Se.string("one sentence: what must be true when this subtask is done")}),Sy=Se.object({observations:Se.string("what you see that matters for the plan: the pose/state of the relevant objects (upright, lying on its side, inside the box, out of reach...)",""),feasible:Se.bool("false only if a top-down parallel-jaw gripper truly cannot do the task",!0),reason:Se.string("if not feasible: why, in one or two sentences",""),clears_obstacle:Se.bool("true when this plan ONLY removes an obstacle that blocks the task (e.g. pushes the box aside); the original task is planned again afterwards",!1),subtasks:or(Se.array(vy,"empty only when not feasible"),[])}),Sd=ar("decomposition","The task split into ordered subtasks",Sy),Md=Se.object({name:Se.string("keypoint name from the scene's keypoint vocabulary"),description:Se.string(void 0,"")}),My=Se.object({name:Se.string("symbolic parameter used by a controller, e.g. o_z, o_theta, f"),description:Se.string("what it means physically, so a scene-aware agent can pick a number"),unit:Se.enum(["m","deg","N"])}),wy=Se.object({type:Se.enum(["PosAlign","AxisAlign","YawAlign","Force","Gripper"]),source:Se.nullable(Se.string(),"PosAlign: point to move (eef_tcp or a held keypoint). AxisAlign: vector to rotate, e.g. eef_z. YawAlign: eef_y"),target:Se.nullable(Se.string(),"PosAlign: static reference point. AxisAlign: reference vector"),axis:Se.nullable(Se.string(),"PosAlign: x|y|z. Force: x|y|z|-x|-y|-z"),param:Se.nullable(Se.string(),"name of the symbolic parameter that supplies the number"),action:Se.nullable(Se.enum(["open","close","width"])),priority:Se.int(void 0,1),stage:Se.int(void 0,0)}),wd=Se.object({subtask_id:Se.int(),keypoints:Se.array(Md,"object keypoints that must be grounded in the scene (NOT eef_tcp / eef_z: those come from the robot)"),controllers:Se.array(wy),params:Se.array(My,"every symbolic parameter referenced by the controllers")}),Ty=Se.object({recipes:Se.array(wd)}),Ay=Se.object({subtask_id:Se.int(),skill_name:Se.string("name of a STORED skill to reuse, or a new snake_case name if you create one"),role_bindings:Se.record('role name -> keypoint name, e.g. {"obj": "bottle_cap", "dest": "box_inside"}. For a NEW skill, every object keypoint used by its controllers must appear here with a role name of your choice'),keypoints:Se.array(Md,"descriptions for keypoints you DEFINE (names not in the vocabulary); may be empty",!0),description:Se.string("NEW skills only: one general sentence about what the skill does, without mentioning specific objects",""),recipe:Se.nullable(wd,"NEW skills only: the full recipe with concrete keypoint names; leave null when reusing a stored skill")}),Ey=Se.object({choices:Se.array(Ay)}),Td=ar("skill_plan","One stored skill to reuse, or a new skill recipe, per subtask",Ey),Ry=Se.object({subtask_id:Se.int(),name:Se.string(),value:Se.number("metres, degrees or newtons according to the parameter's unit"),rationale:Se.string("short justification","")}),Cy=Se.object({values:Se.array(Ry)}),Ad=ar("parameter_groundings","Numeric values for every symbolic parameter",Cy),Py=Se.object({name:Se.string(),u:Se.number("horizontal pixel coordinate (x, increases to the right)"),v:Se.number("vertical pixel coordinate (y, increases downward)"),visible:Se.bool(void 0,!0)}),Iy=Se.object({points:Se.array(Py)}),Ed=ar("pixel_points","Pixel coordinates of the requested keypoints",Iy),ZM=ar("skill_recipes","Concrete recipes",Ty),Cl=i=>({source:null,target:null,axis:null,param:null,action:null,priority:1,stage:0,...i}),ds=i=>({observations:"",feasible:!0,reason:"",clears_obstacle:!1,subtasks:[],...i}),fs=i=>({role_bindings:{},keypoints:[],description:"",recipe:null,...i})});function Aa(i,e){if(!i)return i;if(i.includes("__to__")){let[t,n]=i.split("__to__",2);return`${Aa(t,e)}__to__${Aa(n,e)}`}if(i in e)return e[i];for(let t of Ly)if(i.endsWith(t)&&i.slice(0,-t.length)in e)return e[i.slice(0,-t.length)]+t;return i}var Ly,Rd,Cd,Pd,Id,Ld,lr,Ta,ky,Dy,hr,ur=zt(()=>{"use strict";Ly=["_normal","_norm","_axis"],Rd=/^[a-z][a-z0-9_]{2,48}$/,Cd=i=>({defaults:{},uses:0,successes:0,created:"",...i});Pd=(i,e)=>i.map(t=>({...t,source:Aa(t.source,e),target:Aa(t.target,e)})),Id=(i,e)=>Pd(i.controllers,e),Ld=(i,e)=>Pd(i,Object.fromEntries(Object.entries(e).map(([t,n])=>[n,t]))),lr=class{map=new Map;async list(){return[...this.map.values()].map(e=>structuredClone(e))}async put(e){this.map.set(e.name,structuredClone(e))}async clear(){this.map.clear()}},Ta=i=>String(i).padStart(2,"0"),ky=(i=new Date)=>`${i.getFullYear()}-${Ta(i.getMonth()+1)}-${Ta(i.getDate())} ${Ta(i.getHours())}:${Ta(i.getMinutes())}`,Dy=i=>String(Number(i.toPrecision(6))),hr=class i{constructor(e){this.storage=e}skills={};async reload(){this.skills={};for(let e of(await this.storage.list()).sort((t,n)=>t.name.localeCompare(n.name)))this.skills[e.name]=e}names(){return Object.keys(this.skills).sort()}get(e){return this.skills[e]}async add(e){e.created=e.created||ky(),this.skills[e.name]=e,await this.storage.put(e)}async record(e,t,n){let s=this.skills[e];if(s){if(s.uses+=1,s.successes+=t?1:0,t&&n){let r=new Set(s.params.map(o=>o.name));for(let[o,a]of Object.entries(n))r.has(o)&&(s.defaults[o]=a)}await this.storage.put(s)}}async clear(){let e=Object.keys(this.skills).length;return await this.storage.clear(),this.skills={},e}static ctrlLine(e){let t=[e.source,e.target,e.axis,e.action,e.param].filter(n=>n);return`${e.type}(${t.join(", ")}) p${e.priority}${e.stage?` stage ${e.stage}`:""}`}listing(){let e=Object.values(this.skills);if(!e.length)return"STORED SKILLS: none yet. Create new skills (with a recipe) for every subtask.";let t=["STORED SKILLS (reuse one whenever it fits the subtask: give its name and bind its roles to keypoints; only create a new skill when none fits):"];for(let n of e){let s=n.uses?`${n.successes}/${n.uses} successful`:"not yet used";t.push(`- ${n.name}(roles: ${n.roles.join(", ")}) - ${n.description} [${s}]`),t.push("    controllers: "+n.controllers.map(i.ctrlLine).join("; ")),Object.keys(n.defaults).length&&t.push("    values that worked: "+Object.entries(n.defaults).map(([r,o])=>`${r}=${Dy(o)}`).join(", "))}return t.join(`
`)}api(){return Object.values(this.skills).map(e=>({name:e.name,description:e.description,roles:e.roles,uses:e.uses,successes:e.successes,created:e.created,defaults:e.defaults,controllers:e.controllers.map(i.ctrlLine)}))}}});var ps,On,Pl,Il,Ci,kd,Ea,Ny,ui,Uy,Fy,Oy,Ra,ms,dr=zt(()=>{"use strict";us();cr();ur();ps=class extends Error{},On=class extends Error{},Pl={},Il={},Ci=class{constructor(e,t,n={},s){this.llm=e;this.robot=t;this.opts=n;this.system=(Pl[s]??"")+(["task_decomposer","skill_generator","parameter_setter"].includes(s)?`
`+(Il[t.id]??""):"")}trace=[];emit=null;tempBoost=0;system;async call(e,t,n=2,s=""){let r=null;this.emit?.({type:"agent_start",agent:this.name,label:s});let o=e;for(let a=0;a<n;a++)try{let c=await this.llm.structured({agent:this.name,system:this.system,messages:[{role:"user",content:o}],schema:this.schema,maxTokens:this.opts.maxTokens??this.llm.agentDefaults?.[this.name]?.maxTokens??2e3,temperature:Math.min(1,(this.opts.temperature??this.llm.agentDefaults?.[this.name]?.temperature??0)+this.tempBoost)});if(t){let l=t(c);l!==void 0&&(c=l)}return this.trace.push({agent:this.name,label:s,attempt:a,output:c}),this.emit?.({type:"agent",agent:this.name,label:s,output:c}),c}catch(c){if(!(c instanceof Ie))throw c;r=c,this.trace.push({agent:this.name,label:s,attempt:a,rejected:c.message.slice(0,800)}),this.emit?.({type:"agent_rejected",agent:this.name,label:s,reason:c.message.slice(0,300)}),o=[...o,`

Your previous answer was rejected: ${c.message.slice(0,800)}
Correct it and answer again.`]}throw new ps(`${this.name}: no valid answer after ${n} attempts: ${r instanceof Error?r.message:String(r)}`)}},kd=i=>({type:"image",mediaType:"image/png",load:()=>i.png()}),Ea=class extends Ci{name="task_decomposer";schema=Sd;constructor(e,t,n){super(e,t,n,"task_decomposer")}run(e,t,n,s){let r=`Instruction: ${e}

Scene facts: ${n}
`;s&&(r+=`
FAILURE CONTEXT: ${s}
`);let o=a=>{if(!a.feasible){if(a.reason.trim().length<10)throw new Ie("if the task is infeasible, explain why in `reason`");return}if(!(a.subtasks.length>=2&&a.subtasks.length<=12))throw new Ie("expected between 2 and 12 subtasks");a.subtasks.forEach((c,l)=>c.id=l+1)};return this.call([r,kd(t)],o,2,"decompose")}},Ny={m:[-1,1],deg:[-360,360],N:[.5,30]},ui=class i extends Ci{name="parameter_setter";schema=Ad;constructor(e,t,n){super(e,t,n,"parameter_setter")}run(e,t,n,s,r,o,a){let c=Object.fromEntries(t.subtasks.map(d=>[d.id,d.name])),l=[];for(let d of n.recipes){l.push(`Subtask ${d.subtask_id}: ${c[d.subtask_id]}`);for(let f of d.controllers)l.push(`  stage ${f.stage} p${f.priority}: `+JSON.stringify(Object.fromEntries(Object.entries(f).filter(([,g])=>g!==null))));for(let f of d.params)l.push(`  PARAM ${f.name} [${f.unit}]: ${f.description}`);let u=a?.[d.subtask_id];u&&Object.keys(u).length&&l.push("  values that worked when this stored skill succeeded before (a starting point - adapt to THIS scene): "+Object.entries(u).map(([f,g])=>`${f}=${Number(g.toPrecision(6))}`).join(", "))}let h=`Instruction: ${e}

Scene facts: ${r}

Skill recipes:
`+l.join(`
`);return o&&(h+=`

FAILURE CONTEXT: ${o}`),this.call([h,kd(s)],d=>i.check(d,n),2,"parameters")}static check(e,t){let n=new Map(e.values.map(s=>[`${s.subtask_id}:${s.name}`,s.value]));for(let s of t.recipes)for(let r of s.params){let o=n.get(`${s.subtask_id}:${r.name}`);if(o===void 0)throw new Ie(`missing value for subtask ${s.subtask_id} parameter ${r.name}`);let[a,c]=Ny[r.unit];if(!(a<=o&&o<=c))throw new Ie(`subtask ${s.subtask_id} ${r.name}=${o} is outside the plausible range ${a}..${c} ${r.unit}`)}}static valuesFor(e,t){return Object.fromEntries(e.values.filter(n=>n.subtask_id===t).map(n=>[n.name,n.value]))}},Uy=new Set(["eef_x","eef_y","eef_z","eef_x_axis","eef_y_axis","eef_z_axis","world_x","world_y","world_z"]),Fy={PosAlign:"m",AxisAlign:"deg",YawAlign:"deg",Force:"N",Gripper:"m"},Oy=/^[a-z][a-z0-9_]{1,40}$/,Ra=class i extends Ci{name="skill_generator";schema=Td;constructor(e,t,n){super(e,t,n,"skill_generator")}async run(e,t,n,s,r){let o=t.subtasks.map(u=>`${u.id}. ${u.name} - ${u.description}`).join(`
`),a=Object.entries(n).map(([u,f])=>`- ${u}: ${f}`).join(`
`),c=s?s.listing():"STORED SKILLS: none (library disabled). Create new skills.",l=`Instruction: ${e}

Subtasks:
${o}

Scene keypoint vocabulary (known keypoints you can use directly; each also has a <name>_normal surface-normal vector). You may also DEFINE new keypoints for places/things not listed:
${a}

${c}

${yd(this.robot.max_width,this.robot.force_sensor)}`;r&&(l+=`
FAILURE CONTEXT: ${r}
`);let h=this.robot.force_sensor,d=await this.call([l],u=>void i.assemble(u,t,n,s,h),3,"recipes");return i.assemble(d,t,n,s,h)}static assemble(e,t,n,s,r=!0){if(JSON.stringify(e.choices.map(h=>h.subtask_id))!==JSON.stringify(t.subtasks.map(h=>h.id)))throw new Ie("need exactly one choice per subtask, in order, with matching subtask_id");let o=[],a=[],c=new Map;for(let h of e.choices)for(let d of h.keypoints)d.name in n||c.set(d.name,d);for(let h of e.choices){let d=h.subtask_id,u=[...c.values()],f;if(h.recipe===null){let g=s?.get(h.skill_name);if(!g)throw new Ie(`subtask ${d}: '${h.skill_name}' is not a stored skill (${s?JSON.stringify(s.names()):"library disabled"}). Reuse one of those, or CREATE a new skill by providing \`recipe\` (and a new name).`);let b=g.roles.filter(m=>!(m in h.role_bindings));if(b.length)throw new Ie(`subtask ${d}: skill '${g.name}' needs role_bindings for ${JSON.stringify(b)}`);f={subtask_id:d,keypoints:u,controllers:Id(g,h.role_bindings),params:g.params.map(m=>({...m}))}}else{if(s&&s.names().includes(h.skill_name)){let p=2;for(;s.names().includes(`${h.skill_name}_v${p}`);)p++;h={...h,skill_name:`${h.skill_name}_v${p}`}}if(!Rd.test(h.skill_name))throw new Ie(`subtask ${d}: skill names are lowercase snake_case (3-48 chars)`);if(h.description.trim().length<15)throw new Ie(`subtask ${d}: a new skill needs a general one-sentence \`description\``);let g=h.recipe;f={...g,subtask_id:d,keypoints:[...g.keypoints,...u]};let b=new Set(Object.values(h.role_bindings)),m=li(f.controllers).filter(p=>!b.has(p));if(m.length)throw new Ie(`subtask ${d}: put every object keypoint used by the new skill into role_bindings (role name -> keypoint); missing: ${JSON.stringify(m)}`)}o.push(f),a.push({subtask_id:d,skill_name:h.skill_name,reused:h.recipe===null,role_bindings:{...h.role_bindings},description:h.description})}let l={recipes:o};return i.check(l,t,n,r),{recipes:l,infos:a.map((h,d)=>({...h,recipe:structuredClone(l.recipes[d])}))}}static check(e,t,n,s=!0){if(JSON.stringify(e.recipes.map(r=>r.subtask_id))!==JSON.stringify(t.subtasks.map(r=>r.id)))throw new Ie("need exactly one recipe per subtask, in order, with matching subtask_id");for(let r of e.recipes){let o=new Map;for(let l of r.keypoints)l.name in n||o.set(l.name,l.description.trim());for(let[l,h]of o){if(!Oy.test(l)||/(_normal|_norm|_axis)$/.test(l))throw new Ie(`subtask ${r.subtask_id}: '${l}' is not a valid new keypoint name (lowercase snake_case, must not end with _normal/_axis)`);if(h.length<8)throw new Ie(`subtask ${r.subtask_id}: new keypoint '${l}' needs a precise description of what the vision system should point at`)}for(let l of r.controllers){let h=r.subtask_id;if(l.type==="Force"&&!s)throw new Ie(`subtask ${h}: this robot has NO force sensor, so the Force controller is not available. Lower onto surfaces with PosAlign and a small z offset instead (e.g. hold the object's keypoint at its own height + 0.003 m above the surface).`);if((l.type==="PosAlign"||l.type==="AxisAlign"||l.type==="YawAlign")&&!(l.source&&l.target))throw new Ie(`subtask ${h}: ${l.type} needs source and target`);if(l.type==="PosAlign"&&!["x","y","z"].includes(l.axis||"z"))throw new Ie(`subtask ${h}: PosAlign axis must be x, y or z`);if(l.type==="Force"&&!["x","y","z"].includes((l.axis||"").replace(/^[-+]+/,"")))throw new Ie(`subtask ${h}: Force axis must be one of x,y,z,-x,-y,-z`);if(l.type==="Gripper"&&l.action===null)throw new Ie(`subtask ${h}: Gripper needs action open|close|width`);if(l.type==="Gripper"&&l.action==="width"&&!l.param)throw new Ie(`subtask ${h}: Gripper width needs a param`);if(["PosAlign","AxisAlign","YawAlign","Force"].includes(l.type)&&!l.param)throw new Ie(`subtask ${h}: ${l.type} needs a symbolic param`);for(let d of[l.source,l.target]){for(let u of Rl(d))if(!(u in n)&&!o.has(u))throw new Ie(`subtask ${h}: unknown keypoint '${u}'. Use one of ${JSON.stringify(Object.keys(n).sort())} (plus eef_tcp, eef_z), or DEFINE a new one: add {"name": "...", "description": "..."} to the \`keypoints\` list of one of your choices (a definition anywhere in the plan counts for all subtasks; it works for reused skills too) with a precise description of what to point at, e.g. 'an empty spot on the table to the right of the box'.`);if(l.type==="YawAlign"&&d!=="eef_y"&&d!=="eef_y_axis"&&!(d??"").endsWith("_axis")&&!(d??"").includes("__to__"))throw new Ie(`subtask ${h}: YawAlign source must be eef_y and target <keypoint>_axis`);if(l.type==="AxisAlign"&&!Uy.has(d??"")&&!/(_normal|_norm)$/.test(d??"")&&!(d??"").includes("__to__"))throw new Ie(`subtask ${h}: AxisAlign vectors must be eef_z or <keypoint>_normal`)}}let a=["PosAlign","AxisAlign","YawAlign","Force"];for(let l of r.controllers.filter(h=>h.type==="Gripper"&&h.action==="close"))if(r.controllers.some(h=>a.includes(h.type)&&h.stage===l.stage))throw new Ie(`subtask ${r.subtask_id}: Gripper(close) is in the same stage as motion controllers, so the fingers would close during the motion. Put the motion in stage 0 and Gripper(close) in stage 1.`);for(let l of r.controllers)if(l.type==="PosAlign"&&l.source==="eef_tcp"&&l.target==="eef_tcp"&&l.axis==="z"&&l.stage===0&&r.controllers.some(h=>h.type==="Gripper"&&h.action==="open"&&h.stage===0))throw new Ie(`subtask ${r.subtask_id}: retracting in the same stage as Gripper(open) would drag the object along. Open in stage 0, retract in stage 1.`);r.keypoints=li(r.controllers).map(l=>({name:l,description:n[l]||o.get(l)||""}));let c=new Set(r.params.map(l=>l.name));for(let l of r.controllers)l.param&&!c.has(l.param)&&(r.params.push({name:l.param,description:`${l.type} parameter`,unit:Fy[l.type]}),c.add(l.param))}}},ms=class{constructor(e){this.env=e}name="oracle_grounder";trace=[];lastPixels={};async ground(e){let t={};for(let n of e){if(!this.env.hasKeypoint(n.name))throw new On(`oracle grounding only knows simulator keypoints, not '${n.name}' - use Vision grounding`);let[s,r]=this.env.visibleKeypoint(n.name),[o,a]=this.env.gtAxis(n.name);t[n.name]=md(n.name,s,r,o,a)}return t}}});var Xd,di,Oa,yr=zt(()=>{"use strict";Xd=i=>typeof i!="string",di=class{calls=[];add(e){this.calls.push(e)}get nCalls(){return this.calls.length}get inputTokens(){return this.calls.reduce((e,t)=>e+t.input_tokens,0)}get outputTokens(){return this.calls.reduce((e,t)=>e+t.output_tokens,0)}get latencyS(){return this.calls.reduce((e,t)=>e+t.latency_s,0)}byAgent(){let e={};for(let t of this.calls)e[t.agent]=(e[t.agent]??0)+1;return e}cost(e){return(this.inputTokens*e.input_per_m+this.outputTokens*e.output_per_m)/1e6}},Oa={input_per_m:0,output_per_m:0}});var Jd,Kd=zt(()=>{"use strict";Jd={region:"us-east-1",default_model:"us.anthropic.claude-sonnet-4-5-20250929-v1:0",agents:{task_decomposer:{model:null,temperature:0,max_tokens:1500},skill_generator:{model:null,temperature:0,max_tokens:4e3},parameter_setter:{model:null,temperature:0,max_tokens:2e3},vision_grounder:{model:null,temperature:0,max_tokens:1500}},retry:{max_attempts:3,base_delay_s:1.5},pricing:{input_per_m:3,output_per_m:15}}});function ef(i,e,t,n,s){let r=t.trim(),o=r.toLowerCase(),a=(c,l)=>new Dt(c,l,e,i);if(o.includes("operation not allowed"))return a("AWS refused to invoke any Bedrock model for this account ('Operation not allowed'). Your keys are valid; this is an account-level restriction. Check AWS Billing (payment method, unpaid invoices), Service Quotas, Organizations policies, and try the same model in the Bedrock console playground.","access");switch(e){case"UnrecognizedClientException":case"InvalidClientTokenId":return a("AWS does not recognise these credentials: the access key ID or the session token is not valid. Check them and the region.","credentials");case"InvalidSignatureException":case"SignatureDoesNotMatch":return a("The secret access key does not match the access key ID (or the computer clock is far off). Re-enter the secret key.","credentials");case"ExpiredTokenException":case"ExpiredToken":return a("These temporary credentials have expired. Create new ones and connect again.","expired");case"IncompleteSignature":case"MissingAuthenticationToken":return a("AWS could not read the credentials. Check that the access key ID and secret are complete.","credentials");case"ThrottlingException":case"TooManyRequestsException":return a("Amazon Bedrock is throttling this account (too many requests). Wait a moment and run again, or request a higher quota.","throttle");case"ServiceQuotaExceededException":return a(`Your Bedrock quota for ${n} is used up: ${r}`,"quota");case"ModelTimeoutException":return a(`${n} took too long to answer. Try again.`,"timeout");case"ResourceNotFoundException":return a(`Model ${n} is not available in ${s} for this account (${r||"not found"}). Pick another model or region.`,"model");case"ModelNotReadyException":return a(`${n} is still starting up. Try again in a minute.`,"server");case"ServiceUnavailableException":case"InternalServerException":return a("Amazon Bedrock is temporarily unavailable. Try again in a moment.","server");case"ModelErrorException":return a(`The model failed while answering: ${r}`,"server");case"AccessDeniedException":case"AccessDenied":return a(o.includes("model")||o.includes("bedrock")?`Access to ${n} is denied for these credentials: ${r}. Enable the model in the Bedrock console (Model access) and allow bedrock:InvokeModel for the IAM user.`:`These credentials are valid but not allowed to do this. Grant bedrock:InvokeModel to the IAM user. ${r}`,"access");case"ValidationException":return o.includes("temperature")?a(`Bedrock rejected the request: ${r}`,"rejected"):o.includes("model identifier")||o.includes("on-demand throughput")||o.includes("inference profile")||o.includes("doesn't support")||o.includes("not supported")?a(`${n} cannot be used in ${s} this way (${r}). Choose a model or inference profile that is available in this region.`,"model"):a(`Bedrock rejected the request: ${r}`,"rejected")}return i===401||i===403?a(`Bedrock refused the credentials (HTTP ${i}${e?`, ${e}`:""}). ${r}`.trim(),"credentials"):i===404?a(`Model ${n} was not found in ${s}. Pick another model or region.`,"model"):i===429?a("Amazon Bedrock is throttling this account. Wait a moment and run again.","throttle"):i>=500?a(`Amazon Bedrock returned an error (HTTP ${i}${e?`, ${e}`:""}).`,"server"):a(`Bedrock error${e?` ${e}`:""} (HTTP ${i}): ${r.slice(0,300)}`,"other")}var Dt,Fx,Zd,Qd,jl,tf=zt(()=>{"use strict";Dt=class extends Error{constructor(t,n,s="",r=0){super(t);this.kind=n;this.code=s;this.status=r;this.name="BedrockError"}},Fx=new Set(["ThrottlingException","ModelTimeoutException","ServiceUnavailableException","InternalServerException","ModelNotReadyException"]),Zd=(i,e)=>{let t=i??"";if(!t&&e&&typeof e=="object"){let n=e.__type??e.code;typeof n=="string"&&(t=n)}return t.split(":")[0].split("#").pop().trim()},Qd=(i,e)=>Fx.has(i)||e===429||e===503||e===500||e===408;jl=i=>new Dt(`Could not reach bedrock-runtime.${i}.amazonaws.com from this browser. Check your connection and any VPN, firewall or ad-blocker that blocks amazonaws.com; a browser also reports a blocked cross-origin (CORS) answer this way. Nothing was sent to the Dooms server.`,"network")});async function nf(i){let e=typeof i=="string"?Jl.encode(i):i;return sf(await crypto.subtle.digest("SHA-256",e))}async function ql(i,e){let t=await crypto.subtle.importKey("raw",i,{name:"HMAC",hash:"SHA-256"},!1,["sign"]);return crypto.subtle.sign("HMAC",t,Jl.encode(e))}async function rf(i){let e=new URL(i.url),t=Bx(i.now??new Date),n=t.slice(0,8),s={};for(let[f,g]of Object.entries(i.headers))s[f.toLowerCase()]=g.trim().replace(/\s+/g," ");s["x-amz-date"]=t,i.keys.sessionToken&&(s["x-amz-security-token"]=i.keys.sessionToken);let r={...s,host:e.host},o=Object.keys(r).sort(),a=[...e.searchParams.entries()].map(([f,g])=>[Yl(f),Yl(g)]).sort((f,g)=>f[0]===g[0]?f[1]<g[1]?-1:1:f[0]<g[0]?-1:1).map(([f,g])=>`${f}=${g}`).join("&"),c=[i.method.toUpperCase(),Ox(e.pathname),a,o.map(f=>`${f}:${r[f]}
`).join(""),o.join(";"),await nf(i.body)].join(`
`),l=`${n}/${i.region}/${i.service}/aws4_request`,h=["AWS4-HMAC-SHA256",t,l,await nf(c)].join(`
`),d=await ql(Jl.encode("AWS4"+i.keys.secretAccessKey),n);for(let f of[i.region,i.service,"aws4_request"])d=await ql(d,f);let u=sf(await ql(d,h));return s.authorization=`AWS4-HMAC-SHA256 Credential=${i.keys.accessKeyId}/${l}, SignedHeaders=${o.join(";")}, Signature=${u}`,s}var Jl,sf,Yl,Ox,Bx,of=zt(()=>{"use strict";Jl=new TextEncoder,sf=i=>Array.from(new Uint8Array(i),e=>e.toString(16).padStart(2,"0")).join("");Yl=i=>encodeURIComponent(i).replace(/[!'()*]/g,e=>"%"+e.charCodeAt(0).toString(16).toUpperCase()),Ox=i=>i.split("/").map(e=>e&&Yl(e)).join("/")||"/",Bx=i=>i.toISOString().replace(/[:-]|\.\d{3}/g,"")});var df={};Ar(df,{BedrockLLM:()=>Wa,bedrockFromMessage:()=>Gx,buildConverseBody:()=>hf,parseConverse:()=>uf,toBase64:()=>lf,toolSchema:()=>cf});function cf(i,e={}){let t=n=>{if(Array.isArray(n))return n.map(t);if(!n||typeof n!="object")return n;let s=n;if(typeof s.$ref=="string")return t(e[s.$ref.split("/").pop()]);if(Array.isArray(s.anyOf)){let r=s.anyOf.filter(o=>o.type!=="null");if(r.length===1){let{anyOf:o,...a}=s;return t({...r[0],...a})}}return Object.fromEntries(Object.entries(s).filter(([r])=>!["title","$defs","default"].includes(r)).map(([r,o])=>[r,t(o)]))};return t(i)}function lf(i){let e="";for(let t=0;t<i.length;t+=32768)e+=String.fromCharCode(...i.subarray(t,t+32768));return btoa(e)}async function zx(i){let e=[];for(let t of i){if(!Xd(t)){e.push({text:t});continue}let n=await t.load();n&&e.push({image:{format:t.mediaType==="image/jpeg"?"jpeg":"png",source:{bytes:lf(n)}}})}return e}async function hf(i){let e=[];for(let t of i.messages)e.push({role:t.role,content:await zx(t.content)});return{system:[{text:i.system}],messages:e,inferenceConfig:{maxTokens:i.maxTokens,...i.temperature===void 0?{}:{temperature:i.temperature}},toolConfig:{tools:[{toolSpec:{name:af,description:"Submit the final structured answer.",inputSchema:{json:cf(i.schema.jsonSchema)}}}],toolChoice:{tool:{name:af}}}}}function uf(i,e,t){let n=e??{},s={inputTokens:n.usage?.inputTokens??0,outputTokens:n.usage?.outputTokens??0};for(let r of n.output?.message?.content??[]){let o=r.toolUse;if(!o)continue;let a=o.input;if(typeof a=="string")try{a=JSON.parse(a)}catch{throw new Ie(`${i}: the tool call was not valid JSON`)}return{value:t.parse(a),...s}}throw new Ie(`${i}: model returned no tool call (stopReason=${n.stopReason??"?"})`)}function Gx(i,e={}){let t=i.credentials;if(!t||!t.bearer_token&&!(t.access_key_id&&t.secret_access_key))throw new Dt('Claude needs your AWS credentials. Choose "Connect AWS" first.',"credentials");return new Wa(t,{...e,model:typeof i.model=="string"&&i.model?i.model:e.model})}var af,Vx,Wa,ff=zt(()=>{"use strict";yr();cr();Kd();tf();of();af="submit";Vx=(i,e)=>new Promise((t,n)=>{if(e.aborted)return n(new Dt("Stopped.","cancelled"));let s=setTimeout(t,i);e.addEventListener("abort",()=>{clearTimeout(s),n(new Dt("Stopped.","cancelled"))},{once:!0})}),Wa=class{constructor(e,t={}){this.creds=e;this.cfg=t.config??Jd,this.region=(e.region||this.cfg.region).trim(),this.defaultModel=t.model||this.cfg.default_model,this.pricing=this.cfg.pricing,this.agentDefaults=Object.fromEntries(Object.entries(this.cfg.agents).map(([n,s])=>[n,{maxTokens:s.max_tokens,temperature:s.temperature}])),this.doFetch=t.fetch??((...n)=>fetch(...n)),this.sleep=t.sleep??Vx,this.timeoutMs=t.timeoutMs??18e4,this.now=t.now??(()=>new Date)}usage=new di;remote=!0;defaultModel;pricing;agentDefaults;region;cfg;inflight=new Set;noTemperature=new Set;stopped=!1;doFetch;sleep;timeoutMs;now;modelFor(e){return this.cfg.agents[e]?.model||this.defaultModel}abort(){this.stopped=!0;for(let e of this.inflight)e.abort()}async converse(e,t){if(this.stopped)throw new Dt("Stopped.","cancelled");let n=`https://bedrock-runtime.${this.region}.amazonaws.com/model/${encodeURIComponent(e)}/converse`,s=JSON.stringify(t),r,o=this.creds;if(o.bearer_token)r={"content-type":"application/json",authorization:`Bearer ${o.bearer_token.trim()}`};else{if(!o.access_key_id?.trim()||!o.secret_access_key?.trim())throw new Dt("AWS access key ID and secret access key are required.","credentials");r=await rf({method:"POST",url:n,headers:{"content-type":"application/json"},body:s,region:this.region,service:"bedrock",now:this.now(),keys:{accessKeyId:o.access_key_id.trim(),secretAccessKey:o.secret_access_key.trim(),sessionToken:o.session_token?.trim()||void 0}})}let a=new AbortController;this.inflight.add(a);let c=!1,l=setTimeout(()=>{c=!0,a.abort()},this.timeoutMs);try{let h;try{h=await this.doFetch(n,{method:"POST",headers:r,body:s,signal:a.signal,cache:"no-store",credentials:"omit"})}catch(f){throw c?new Dt(`${e} did not answer within ${Math.round(this.timeoutMs/1e3)} s.`,"timeout"):a.signal.aborted||f instanceof Error&&f.name==="AbortError"?new Dt("Stopped.","cancelled"):jl(this.region)}let d;try{d=await h.text()}catch(f){throw c?new Dt(`${e} did not answer within ${Math.round(this.timeoutMs/1e3)} s.`,"timeout"):a.signal.aborted?new Dt("Stopped.","cancelled"):jl(this.region)}let u=null;try{u=d?JSON.parse(d):null}catch{}if(!h.ok){let f=Zd(h.headers.get("x-amzn-errortype"),u),g=(u&&typeof u=="object"&&typeof u.message=="string"?u.message:"")||h.headers.get("x-amzn-errormessage")||"";throw ef(h.status,f,g,e,this.region)}return u}finally{clearTimeout(l),this.inflight.delete(a)}}async structured(e){let t=this.modelFor(e.agent),n=e.maxTokens??this.agentDefaults[e.agent]?.maxTokens??2e3,s=this.cfg.retry;for(let r=0;r<s.max_attempts;r++){let o=performance.now(),a=await hf({...e,maxTokens:n,temperature:this.noTemperature.has(t)?void 0:e.temperature??0}),c=(l,h,d)=>this.usage.add({agent:e.agent,model:t,input_tokens:l,output_tokens:h,latency_s:(performance.now()-o)/1e3,ok:d});try{let l=await this.converse(t,a),h=(()=>{try{return uf(e.agent,l,e.schema)}catch(d){let u=l?.usage;throw c(u?.inputTokens??0,u?.outputTokens??0,!1),d}})();return c(h.inputTokens,h.outputTokens,!0),h.value}catch(l){if(l instanceof Ie||!(l instanceof Dt))throw l;if(c(0,0,!1),l.kind==="rejected"&&/temperature/i.test(l.message)&&!this.noTemperature.has(t)){this.noTemperature.add(t),r--;continue}if(l.kind==="cancelled")throw l;if((Qd(l.code,l.status)||l.kind==="throttle"||l.kind==="server")&&r<s.max_attempts-1){let h=new AbortController;this.inflight.add(h);try{await this.sleep(s.base_delay_s*2**r*1e3,h.signal)}finally{this.inflight.delete(h)}continue}throw l}}throw new Dt("Bedrock did not answer.","other")}}});var gf={};Ar(gf,{AGENT_PROMPTS:()=>pf,ROBOT_SPECS:()=>mf,registerPrompts:()=>Hx});function Hx(){Object.assign(Pl,pf),Object.assign(Il,mf)}var pf,mf,_f=zt(()=>{"use strict";dr();pf={task_decomposer:`You are the Task Decomposer of a robot manipulation system. A single-arm robot with a parallel-jaw
gripper works at a table; you see an RGB image of the scene.

FIRST look at the image and describe, in \`observations\`, the state of every object the task involves (write explicitly 'standing upright' or 'lying on its side' for anything
elongated): is the
bottle standing or lying on its side? is anything already in the box, blocking, fallen, out of reach, or missing?
The robot only has a parallel-jaw gripper that works top-down. Plan around the state you actually see. If the task
really cannot be done with it (e.g. an object lying down is longer than the box is wide and the task needs it
inside), set feasible=false and explain in \`reason\` instead of producing a plan that cannot work.

Then convert the instruction into an ORDERED list of subtasks that expose the temporal and semantic
structure of the behaviour. Do not mention controllers, coordinates or numbers.

Guidelines
- Each subtask is one physically meaningful phase that a controller stack can finish on its own:
  approach, grasp, lift, move over the destination, place down, release / retract, etc.
- Keep a subtask boundary wherever the gripper opens or closes, or wherever the held object changes.
- Typical pick-and-place: "Approach <object> for pre-grasp", "Grasp <object>", "Lift <object> up",
  "Move over <destination>", "Place down <object>", "Release and retract".
- Stacking or other tasks follow the same pattern with the appropriate objects.
- 4 to 8 subtasks. Use short imperative names; the description states what is true when it is done.
- If a FAILURE CONTEXT is given, the previous attempt went wrong: plan a recovery from the CURRENT
  scene and gripper state shown, not from the beginning of the original plan.

Obstacles
- The image has the robot's world axes drawn on it (+x away from the robot, +y to the robot's left, z up) and the
  robot base marked. Use them whenever you talk about directions.
- Look for anything that could get in the way of the gripper: an object right beside the thing to grasp (the open
  fingers need about 6 cm of free table on each side of it), something standing in the path, a target hidden
  behind another object. Mention it in \`observations\`.
- If the FAILURE CONTEXT starts with "OBSTACLE:", a depth measurement has ALREADY confirmed that an object blocks a
  finger at the grasp point (it gives world coordinates, size and which side). Decide how to clear it and plan ONLY
  the clearing steps, then set \`clears_obstacle=true\`; the original task is planned again automatically from the new
  scene afterwards. (If the message starts with "OBSTACLE: Surface check", nothing needs clearing: plan the task
  again with clears_obstacle=false, choosing a grasp point on an upward-facing surface as it says.) Ways to clear an
  obstacle:
    * PUSH it away with the closed gripper (works for the box/tray and for cubes): pick the push direction along a
      world axis so that (a) the pusher can stand on bare table on the OPPOSITE side of the obstacle (not where another
      object is), (b) the path is free, (c) the obstacle ends up at least ~10 cm from the grasp target's finger space,
      (d) everything stays within reach (x 0.3-0.65 m, |y| < 0.35 m). Typical pushing subtasks: "Move above the push
      start point", "Lower the closed gripper beside the <obstacle>", "Push the <obstacle> away", "Retract upward".
    * PICK it up and put it on a free spot of the table (small light objects such as cubes).
  Never push an object toward the thing you need to grasp. If nothing can clear the obstacle, set feasible=false.
`,skill_generator:`You are the Skill Generator of a robot manipulation system. For each subtask you choose an ABSTRACT
skill recipe out of a fixed controller library: which object keypoints are needed, which controllers
run, with which symbolic parameters and priorities. You do not choose numbers here; another agent
sets the parameters after seeing the scene.

Rules
- Use ONLY controller types from the library. For a grasp, prefer the scene-vocabulary keypoint that marks the HIGHEST
  graspable part of the object (the robot spec's palm limit) over inventing a lower one. Keypoints: prefer names from the scene vocabulary, but you are NOT
  limited to it. When the task needs a place or feature that is not listed (a free spot on the table, the area
  beside or outside the box, the top of some other object, a point on a surface...), DEFINE a new keypoint: give it a
  snake_case name and add {name, description} to the \`keypoints\` list of a choice (once is enough for the whole plan; also
  when you reuse a stored skill) with a precise description of what the vision system
  should point at (e.g. name \`table_free_spot\`, description 'an empty spot of bare table to the right of the box, at
  least 10 cm from every object'). Never reuse a vocabulary keypoint for a different meaning (box_inside is INSIDE
  the box). eef_tcp (gripper fingertip centre) and eef_z (gripper pointing direction) are built in and must NOT
  be listed in \`keypoints\`; only list object keypoints that the subtask's controllers reference.
- Every controller number comes from a symbolic parameter: set \`param\` on the controller and declare
  the parameter in \`params\` with a physical description and a unit (m, deg, N). Parameter names are per
  subtask (o_x, o_y, o_z, o_theta, f, g, ...). If one subtask uses several offsets along the same axis
  give them distinct names (o_z_hover, o_z_final).
- Reaching a 3D position needs PosAlign on x, y and z. Keep the gripper pointing straight down with
  AxisAlign(eef_z, world_z, o_theta) with param o_theta = 180 (world_z is the exact up vector; this is the robust way
  and it is REQUIRED for curved objects such as a lying bottle). Use <keypoint>_normal only for a genuinely tilted flat surface.
- Object keypoints are grounded at the START of each subtask from a fresh image. When the robot holds an
  object, the held keypoint (e.g. the bottle cap) is the PosAlign \`source\`, and \`target\` is the
  destination keypoint. To move a held object relative to where it is now, use source = target = the
  held keypoint with an offset (e.g. lift: PosAlign(bottle_cap, bottle_cap, z) with o_z > 0).
  To move the gripper relative to its current position use target = eef_tcp.
- Grasp: stage 0 descends the gripper onto the grasp point (PosAlign eef_tcp -> keypoint on x, y, z with a
  grasp-depth offset param o_d, plus AxisAlign to keep the gripper vertical), stage 1 is Gripper(close).
- Pre-grasp approach: PosAlign of eef_tcp to a point above the grasp keypoint (hover offset o_z) on x, y, z,
  plus AxisAlign so the gripper points straight down.
- Placing: keep the held keypoint aligned over the destination in x and y, and lower with a Force
  controller (axis -z) instead of a z offset, so the object is set down gently on contact.
- Open the gripper and retract in ONE subtask using stages: stage 0 = Gripper(open), stage 1 = PosAlign
  moving eef_tcp up relative to itself. Never move away while the gripper is still closed on the object.
- Boxy objects (cubes, boxes) must be grasped with the fingers across two parallel faces: add a YawAlign
  (source eef_y, target <keypoint>_axis, param o_yaw = 90 deg) next to the AxisAlign in the approach and grasp
  stages. Do not use YawAlign for round objects such as bottles.
- Axes you do not constrain are held at their current value by the runtime, so you may omit them, but if a
  subtask must keep an axis exactly aligned with something (e.g. x,y over a target) constrain it explicitly.
- LYING / FALLEN objects: ONLY when the plan's observations say the object is lying on its side (otherwise ignore this
  paragraph completely). Then NEVER use a vocabulary keypoint that names a cap / top face of that object (such as
  bottle_cap): on a lying object that surface faces SIDEWAYS and the top-down gripper cannot align with it (the run
  will time out). Define the body keypoints below instead. Do not use the upright grasp. Grasp a lying cylinder
  from above ACROSS its width: define keypoints such as \`<obj>_body_center\` (the middle of the lying body, top
  surface) and \`<obj>_cap_end\` (the far end), hover above the body centre, point the gripper down with
  AxisAlign(eef_z, world_z, 180) (NOT \`<obj>_body_center_normal\`: the normal of a curved surface is unreliable), and add YawAlign(eef_y, <obj>_body_center__to__<obj>_cap_end, o_yaw = 90) in the
  approach AND grasp stages so the fingers close across the body, not along it. The vector \`A__to__B\` is the
  direction from keypoint A to keypoint B. Only the grasp target near the tcp is tracked while held: do not use
  YawAlign with the far end in later subtasks.
- PUSHING (clearing an obstacle): define a keypoint for the push start (\`<obj>_push_start\`: 'a bare-table point just
  outside the <obj>'s wall, on the side opposite to the push direction'). Subtasks: (1) PosAlign(eef_tcp, start) on x, y
  and z (hover), AxisAlign down, then stage 1 Gripper(close) so the closed fingers form a pusher; (2) lower: PosAlign
  x, y hold at the start point and z to a low height above the table (about half the obstacle's height, e.g. 0.03 m);
  (3) push: PosAlign(eef_tcp, eef_tcp, x, o_x), (eef_tcp, eef_tcp, y, o_y), (eef_tcp, eef_tcp, z, o_z=0) - the
  offsets are the world-frame displacement of the push, measured from where the gripper is when the stage starts;
  (4) retract: PosAlign(eef_tcp, eef_tcp, z, +0.12). Closing on nothing is expected here.
- priority: smaller number = more important. Give position controllers priority 1 and orientation
  AxisAlign priority 2. Controllers of one stage run simultaneously.
- Produce exactly one recipe per subtask, in the same order, with matching subtask_id.


WORKED EXAMPLE (a different scene: "put the ball into the basket", keypoints \`ball_top\`, \`basket_inside\`).
Your answer has one choice per subtask. A NEW skill carries the full recipe with concrete keypoints and names the
roles in role_bindings; a REUSED skill has recipe null. Two of the six choices, shown in full:

{"choices": [
 {"subtask_id": 2, "skill_name": "grasp_from_above", "role_bindings": {"obj": "ball_top"},
  "description": "Lower the open gripper onto a target point from above and close the fingers on it.",
  "recipe": {"subtask_id": 2, "keypoints": [], "controllers": [
    {"type": "PosAlign", "source": "eef_tcp", "target": "ball_top", "axis": "x", "param": "o_x", "priority": 1, "stage": 0},
    {"type": "PosAlign", "source": "eef_tcp", "target": "ball_top", "axis": "y", "param": "o_y", "priority": 1, "stage": 0},
    {"type": "PosAlign", "source": "eef_tcp", "target": "ball_top", "axis": "z", "param": "o_d", "priority": 1, "stage": 0},
    {"type": "AxisAlign", "source": "eef_z", "target": "ball_top_normal", "param": "o_theta", "priority": 2, "stage": 0},
    {"type": "Gripper", "action": "close", "priority": 1, "stage": 1}],
   "params": [{"name": "o_x", "description": "x offset from the grasp point", "unit": "m"},
              {"name": "o_y", "description": "y offset from the grasp point", "unit": "m"},
              {"name": "o_d", "description": "signed z offset of the fingertip centre from the grasp point (negative = below)", "unit": "m"},
              {"name": "o_theta", "description": "angle between the gripper direction and the surface normal", "unit": "deg"}]}},
 {"subtask_id": 5, "skill_name": "place_down_on_contact", "role_bindings": {"obj": "ball_top", "dest": "basket_inside"},
  "description": "Lower the held object onto the surface below until contact is felt, keeping it centred over the destination.",
  "recipe": {"subtask_id": 5, "keypoints": [], "controllers": [
    {"type": "PosAlign", "source": "ball_top", "target": "basket_inside", "axis": "x", "param": "o_x", "priority": 1, "stage": 0},
    {"type": "PosAlign", "source": "ball_top", "target": "basket_inside", "axis": "y", "param": "o_y", "priority": 1, "stage": 0},
    {"type": "Force", "axis": "-z", "param": "f", "priority": 1, "stage": 0},
    {"type": "AxisAlign", "source": "eef_z", "target": "basket_inside_normal", "param": "o_theta", "priority": 2, "stage": 0}],
   "params": [{"name": "o_x", "description": "x offset over the destination", "unit": "m"},
              {"name": "o_y", "description": "y offset over the destination", "unit": "m"},
              {"name": "f", "description": "contact force that ends the descent", "unit": "N"},
              {"name": "o_theta", "description": "angle between the gripper direction and the surface normal", "unit": "deg"}]}}]}

Reusing a stored skill for another subtask looks like:
 {"subtask_id": 3, "skill_name": "lift_held", "role_bindings": {"obj": "ball_top"}, "recipe": null}
Conventions the example shows: motion controllers of one stage share priority 1, AxisAlign has priority 2; the gripper
closes in a LATER stage than the descent; placing uses Force(-z) instead of a z offset; every number is a symbolic param.
`,parameter_setter:`You are the Parameter Setter of a robot manipulation system. You receive abstract skill recipes whose
controllers reference symbolic parameters, plus an RGB image of the scene and some scene facts. Choose a
numeric value for every parameter of every subtask.

Units are metres (m), degrees (deg) or newtons (N) as declared. Coordinates: x forward from the robot base,
y left, z up, table top at z = 0.

Think about the geometry:
- Offsets are SIGNED and relative to the target point along the controller's axis: positive z = above the
  target, negative z = below it (a grasp depth below the top of a keypoint is therefore a NEGATIVE z offset).
- Hover / clearance heights must keep the object being carried clear of obstacles: the height of the
  reference point above the destination floor has to exceed the carried object's length below that point
  plus the wall height plus a safety margin (about 0.05 m).
- A grasp depth is how far below the top of a keypoint the fingertip centre goes; the fingertip pads should
  end up centred on the graspable part of the object (for a cap: about half the cap height below its top).
- Pre-grasp approach: hover about 0.10 - 0.15 m above the grasp point before descending.
- Retract heights: about 0.10 - 0.20 m.
- Horizontal offsets are 0 when the point should be centred over the target.
- If the destination (e.g. the box) already contains objects (look at the image), make sure the object lands in
  free space: the grounded destination point already avoids occupants, so keep x/y offsets small, and leave room
  for the open gripper (about 0.08 m wide along its finger axis).
- Yaw offsets (o_yaw): 90 deg makes the fingers close across the object's edge (flat faces).
- Orientation offsets: 180 deg for a gripper pointing down onto an upward-facing surface.
- Contact force thresholds for gentle placement: 2 - 4 N.
- Gripper widths: at most 0.08 m.
- ONLY if the observations say the object lies on its side (never for an object standing upright): a lying cylinder is
  grasped across its diameter: the grasp keypoint is on its TOP surface, so the fingertip
  centre should go about one radius below it (negative z offset of about the radius, e.g. -0.02 m for a 0.045 m
  wide bottle) so the pads sit on the body's axis; the fingertips must not touch the table.
- Pushing: hover 0.10 m above the push start, lower the closed gripper to about half the obstacle's height (0.03 m for
  the 0.05 m tall box), and give the push as a world-frame displacement (o_x, o_y) of 0.15-0.25 m along the chosen
  world axis (use the axes drawn on the image), z displacement 0.
- Gripper geometry: eef_tcp is the centre of the finger pads; the fingertip ends extend about 0.015 m BELOW it.
  Grasp boxy objects a bit above their centre (so the fingertips stay above the object's bottom face) and
  remember that the fingertips, not the object, hit obstacles first when lowering.
Give a one-line rationale per value. Return a value for every declared parameter of every subtask.

WORKED EXAMPLE of the reasoning (a different scene: put a 6 cm diameter ball into a basket 25 cm wide with 12 cm
tall walls; the ball is grasped by its top point \`ball_top\`):
- approach_above: o_x = 0, o_y = 0, o_z = 0.12 (hover about 10-15 cm above the grasp point), o_theta = 180.
- grasp_from_above: o_d = -0.03 (negative = below the top; half the ball's height puts the fingertip pads on its
  equator), o_x = o_y = 0, o_theta = 180.
- lift_held: o_z = 0.20 (clear the table and neighbours).
- move_over (held point \`ball_top\` over \`basket_inside\`): the ball hangs 0.06 m below its top point, the basket wall is
  0.12 m tall, plus 0.08 m margin -> o_z = 0.06 + 0.12 + 0.08 = 0.26. A hover height that is too small drags the object
  through the wall.
- place_down_on_contact: o_x = o_y = 0, f = 2 (newtons), o_theta = 180.
- release_and_retract: o_z = 0.15.
Give each value a rationale of this kind (which sizes it came from) and scale it to the objects in YOUR scene.
`,vision_grounder:`You are the Vision Grounder of a robot manipulation system. You see an RGB image of a tabletop scene
with a labelled pixel grid overlaid (labels give pixel coordinates in this image: x across the top, y down the
left side; grid lines are thin and only for reading coordinates). For each requested keypoint report
the pixel (u, v) where that feature is, where u is the horizontal pixel coordinate and v the vertical one.

- Be precise: point at the exact centre of the described feature (e.g. the middle of the top face of a
  cap, the middle of a box's interior floor), not at the object's silhouette centre or its shadow.
- Keypoints on lying/curved objects: point at the visible surface at the described place (e.g. the top of the
  body at its middle, the top of the cap at the far end), never at the object's shadow.
- Interpolate between grid lines to get sub-grid accuracy.
- If the feature is covered or occupied by another object (e.g. the middle of the box floor while a bottle
  stands in it), point at the nearest VISIBLE EMPTY part of the same surface instead, never at the object on it.
- If a requested feature is not visible (occluded or absent) set visible=false and give your best guess.
- Return one point per requested keypoint, using exactly the requested names.
`},mf={franka:`
ROBOT SPEC (physical facts about this arm and gripper; respect them when planning and choosing numbers)
- 7-DoF arm with a two-finger parallel gripper that points DOWN; base at the world origin; x forward, y left, z up;
  reachable workspace roughly x 0.30-0.65 m, |y| < 0.35 m; table top at z = 0.
- \`eef_tcp\` is the centre of the finger pads. The fingertips extend about 0.015 m below it. The fingers open to at
  most 0.08 m (along the gripper's y axis) and are only about 0.05 m long.
- The PALM (the wide hand body above the fingers) is about 0.045 m above the pad centre and roughly 0.10 m wide.
  Therefore the grasp point must be within about 0.03 m of the TOP of the highest part of the object beneath the hand
  (e.g. grasp a bottle at its cap end, never lower on the body: the palm would crash into the cap). If the graspable
  region is narrower than 0.08 m, that is fine; the fingers straddle it.
- Each open finger needs about 0.06 m of free table on both sides of the grasp point, at table level.
- Squeeze force is moderate; light objects (< 0.2 kg) can be held, a 0.65 kg box cannot be lifted (it can be pushed).
- The gripper cannot re-orient an object in its fingers or stand a lying object back up: a lying object stays lying
  (place it down lying, or leave it). Never plan 'place upright'.
- The controllers work in world axes; positions are metres, angles degrees.
`,so101:`ROBOT SPEC (physical facts about this arm and gripper; respect them when planning and choosing numbers).
THIS ROBOT IS A SMALL DESKTOP ARM (SO-ARM101). Where these facts differ from any generic number in the instructions above
(hover heights, retract heights, gripper opening, force thresholds, reach), THESE FACTS WIN.
- 5-joint arm (shoulder pan, shoulder lift, elbow, wrist flex, wrist roll) with a single-jaw gripper that points DOWN;
  base at the world origin; x forward, y left, z up; table top at z = 0.
- Reach is SHORT: reachable workspace roughly x 0.10-0.30 m, |y| < 0.16 m. Everything on the table is small: objects are
  1.4-3 cm wide and 3-6 cm tall, the box is about 11 cm wide with walls under 2.5 cm tall.
- With the gripper pointing straight down the fingertip centre can only be held up to a limited height that DEPENDS ON
  THE DISTANCE r = sqrt(x^2 + y^2) FROM THE BASE (a target higher than this is unreachable: the arm stalls):
  r 0.12 m: 0.07 m | r 0.16: 0.09 | r 0.20-0.24: 0.10 | r 0.26: 0.09 | r 0.28: 0.08 | r 0.30: 0.07 | r 0.32: 0.04.
  The fingertip centre height you ask for = the keypoint's height + your hover offset, so at the far edge (r >= 0.27) a
  cap 0.046 m high leaves only about 0.02-0.03 m of hover. Therefore ALL heights are small: hover 0.02-0.03 m above a
  grasp point (0.04 only when the target is within r 0.24 m), lifts of 0.02-0.03 m, and retract 0.02-0.03 m at the far
  edge (up to 0.04 m within r 0.24 m). Use the LOWEST heights that still clear obstacles, and check the height limit for the
  target's distance before choosing a number.
- CARRYING AN OBJECT OVER THE BOX: \`box_inside\` is the centre of the box FLOOR and the box walls stand 0.018 m above it.
  A held object hangs BELOW the keypoint you hold it by (a bottle held by \`bottle_cap\` extends 0.046 m below it; a cube held
  by its top face extends 0.025 m below it). So the offset of the held keypoint above \`box_inside\` must be at least
  (object height below the keypoint) + 0.018 + 0.005: about 0.07 m for the bottle and 0.05 m for a cube. A smaller offset
  drives the object into the box wall and it is dropped or knocked out. To stack on a cube, hold the carried cube's top
  keypoint about 0.03 m above the target cube's top keypoint.
- SETTING IT DOWN: the offset of the held keypoint above the surface it should rest on = (object height below the keypoint)
  + 0.004 m: about 0.05 m for the bottle in the box, 0.029 m for a cube (in the box, on the table, or on another cube's top
  keypoint). Then open the gripper.
- \`eef_tcp\` is between the jaws, about 1 cm above the fingertips. One jaw is fixed and one moves: the gripper opens to
  at most 0.055 m (along the gripper's y axis); when it closes, the moving jaw pushes the object slightly toward the
  fixed jaw. Objects here are narrower than the opening. Gripper widths: at most 0.055 m.
- The gripper body above the jaws is about 0.03 m wide, so grasp small objects within about 0.01 m of their TOP
  (a bottle by its cap, a cube a few millimetres below its top face). Each open jaw needs about 0.03 m of free table beside it.
- NO force / torque sensor: NEVER use the Force controller. To set something down, hold the object's keypoint at a small
  z offset above the surface it should rest on (offset = the object's own height + about 0.003 m for a keypoint on its top),
  then open the gripper.
- Positioning accuracy is about 3-5 mm and the gripper is light: light objects (< 0.05 kg) only; the box can be pushed but not lifted.
- The gripper cannot re-orient an object in its fingers or stand a lying object back up. Never plan 'place upright'.
- The controllers work in world axes; positions are metres, angles degrees. Keep the gripper pointing straight down with
  AxisAlign(eef_z, world_z, 180); YawAlign (fingers across a cube's faces) works as usual.
`}});var eh={};Ar(eh,{browserCodec:()=>Wx,cloneRaster:()=>Kl,cropZoomCubic:()=>Ql,drawGrid:()=>Zl,drawPoints:()=>$x,newRaster:()=>bf});function Xa(i,e,t,n){if(e<0||t<0||e>=i.width||t>=i.height)return;let s=(t*i.width+e)*4;i.data[s]=n[0],i.data[s+1]=n[1],i.data[s+2]=n[2],i.data[s+3]=255}function xf(i,e,t,n,s){let r=Math.round(5*yf),o=Math.round(7*yf),a=t;for(let c of e){let l=Xx[c];if(l)for(let h=0;h<o;h++)for(let d=0;d<r;d++)l[Math.min(6,Math.floor(h*7/o))][Math.min(4,Math.floor(d*5/r))]==="1"&&Xa(i,a+d,n-o+h,s);a+=r+2}}function Zl(i,e=80,t=[0,0]){let n=Kl(i),[s,r]=t,o=(a,c)=>(a%c+c)%c;for(let a=o(-s,e);a<n.width;a+=e){for(let c=0;c<n.height;c++)Xa(n,a,c,[255,255,0]);xf(n,String(a+s),a+2,12,[255,255,0])}for(let a=o(-r,e);a<n.height;a+=e){for(let c=0;c<n.width;c++)Xa(n,c,a,[0,255,255]);xf(n,String(a+r),2,a-3,[0,255,255])}return n}function Ql(i,e,t,n,s){let r=bf(n*s,n*s),o=-.75,a=h=>{let d=u=>{let f=Math.abs(u);return f<=1?((o+2)*f-(o+3))*f*f+1:f<2?((o*f-5*o)*f+8*o)*f-4*o:0};return[d(1+h),d(h),d(1-h),d(2-h)]},c=h=>Math.min(e+n-1,Math.max(e,h)),l=h=>Math.min(t+n-1,Math.max(t,h));for(let h=0;h<r.height;h++){let d=(h+.5)/s-.5,u=Math.floor(d),f=a(d-u);for(let g=0;g<r.width;g++){let b=(g+.5)/s-.5,m=Math.floor(b),p=a(b-m);for(let x=0;x<3;x++){let R=0;for(let S=0;S<4;S++){let M=l(t+u+S-1),w=0;for(let E=0;E<4;E++)w+=p[E]*i.data[(M*i.width+c(e+m+E-1))*4+x];R+=f[S]*w}r.data[(h*r.width+g)*4+x]=R}r.data[(h*r.width+g)*4+3]=255}}return r}function $x(i,e){let t=Kl(i);for(let[n,s]of Object.values(e)){let r=Math.round(n),o=Math.round(s);for(let a=-6;a<=6;a++)for(let c=-6;c<=6;c++){let l=Math.hypot(c,a);(l>=4.2&&l<=6.2||l<=1.2)&&Xa(t,r+c,o+a,[255,60,60])}}return t}var bf,Kl,Wx,Xx,yf,$a=zt(()=>{"use strict";bf=(i,e)=>({width:i,height:e,data:new Uint8ClampedArray(i*e*4)}),Kl=i=>({width:i.width,height:i.height,data:new Uint8ClampedArray(i.data)}),Wx={async decode(i){let e=await createImageBitmap(new Blob([i],{type:"image/png"})),t=new OffscreenCanvas(e.width,e.height),n=t.getContext("2d",{willReadFrequently:!0});if(!n)throw new Error("2D canvas is not available");n.drawImage(e,0,0),e.close();let s=n.getImageData(0,0,t.width,t.height);return{width:s.width,height:s.height,data:s.data}},async encode(i,e="image/png",t=.85){let n=new OffscreenCanvas(i.width,i.height),s=n.getContext("2d");if(!s)throw new Error("2D canvas is not available");return s.putImageData(new ImageData(new Uint8ClampedArray(i.data),i.width,i.height),0,0),new Uint8Array(await(await n.convertToBlob({type:e,quality:t})).arrayBuffer())}},Xx={0:["01110","10001","10011","10101","11001","10001","01110"],1:["00100","01100","00100","00100","00100","00100","01110"],2:["01110","10001","00001","00010","00100","01000","11111"],3:["11110","00001","00001","01110","00001","00001","11110"],4:["00010","00110","01010","10010","11111","00010","00010"],5:["11111","10000","11110","00001","00001","10001","01110"],6:["00110","01000","10000","11110","10001","10001","01110"],7:["11111","00001","00010","00100","01000","01000","01000"],8:["01110","10001","10001","01110","10001","10001","01110"],9:["01110","10001","10001","01111","00001","00010","01100"],"-":["00000","00000","00000","11111","00000","00000","00000"]},yf=1.35});function th(i,e,t){let n=i.T_world_cam,s=(e-i.cx)/i.fx,r=-(t-i.cy)/i.fy,o=[n[0]*s+n[1]*r-n[2],n[4]*s+n[5]*r-n[6],n[8]*s+n[9]*r-n[10]],a=Math.hypot(o[0],o[1],o[2]);return[[n[3],n[7],n[11]],[o[0]/a,o[1]/a,o[2]/a]]}function nh(i,e){let t=[...i].sort((o,a)=>o-a),n=(t.length-1)*e/100,s=Math.floor(n),r=Math.min(t.length-1,s+1);return t[s]+(t[r]-t[s])*(n-s)}function jx(i,e,t,n=2,s=50){let r=ys(e),o=ys(t),a=[];for(let c=Math.max(0,o-n);c<Math.min(i.camera.height,o+n+1);c++)for(let l=Math.max(0,r-n);l<Math.min(i.camera.width,r+n+1);l++){let h=i.at(l,c);h>0&&a.push(h)}if(!a.length)throw new vr(`no valid depth near pixel (${e.toFixed(0)},${t.toFixed(0)})`);return nh(a,s)}function qx(i,e){let t=kt.fromRows(i.map(o=>Bn(o,e))),{s:n,V:s}=wa(t),r=0;for(let o=1;o<n.length;o++)n[o]<n[r]&&(r=o);return[s.get(0,r),s.get(1,r),s.get(2,r)]}function Kx(i,e,t,n=4,s){let r=ys(e),o=ys(t),a=[];for(let x=Math.max(0,o-n);x<Math.min(i.camera.height,o+n+1);x++)for(let R=Math.max(0,r-n);R<Math.min(i.camera.width,r+n+1);R++)a.push([R,x,i.at(R,x)]);let c=a.filter(x=>x[2]>0);if(c.length<8)return null;let l=s??nh(c.map(x=>x[2]),20);if(c=c.filter(x=>Math.abs(x[2]-l)<.03),c.length<8)return null;let h=c.map(x=>i.world(x[0],x[1],x[2])),d=h.map(()=>!0),u=null,f=[0,0,0];for(let x=0;x<4&&!(d.filter(Boolean).length<8);x++){f=Yx(h,d),u=qx(h.filter((M,w)=>d[w]),f);let R=h.map(M=>Math.abs(zn(Bn(M,f),u))),S=Math.max(.003,2*Jx(R.filter((M,w)=>d[w])));d=R.map(M=>M<S)}if(!u)return null;let g=h.filter((x,R)=>d[R]),b=Math.sqrt(g.reduce((x,R)=>x+zn(Bn(R,f),u)**2,0)/Math.max(1,g.length)),m=i.camera.T_world_cam;zn(u,Bn([m[3],m[7],m[11]],f))<0&&(u=[-u[0],-u[1],-u[2]]);let p=Math.hypot(u[0],u[1],u[2]);return{n:[u[0]/p,u[1]/p,u[2]/p],c:f,rms:b}}function Sf(i){let e=[...i].sort((s,r)=>s[0]-r[0]||s[1]-r[1]),t=(s,r,o)=>(r[0]-s[0])*(o[1]-s[1])-(r[1]-s[1])*(o[0]-s[0]),n=s=>{let r=[];for(let o of s){for(;r.length>=2&&t(r[r.length-2],r[r.length-1],o)<=0;)r.pop();r.push(o)}return r.pop(),r};return[...n(e),...n([...e].reverse())]}function Zx(i){let e=Sf(i),t=null;for(let n=0;n<e.length;n++){let s=e[n],r=e[(n+1)%e.length],o=r[0]-s[0],a=r[1]-s[1],c=Math.hypot(o,a);if(c===0)continue;let l=o/c,h=a/c,d=1/0,u=-1/0,f=1/0,g=-1/0;for(let m of e){let p=(m[0]-s[0])*l+(m[1]-s[1])*h,x=-(m[0]-s[0])*h+(m[1]-s[1])*l;d=Math.min(d,p),u=Math.max(u,p),f=Math.min(f,x),g=Math.max(g,x)}let b=(u-d)*(g-f);if(!t||b<t.area){let m=(p,x)=>[s[0]+p*l-x*h,s[1]+p*h+x*l];t={area:b,corners:[m(d,f),m(u,f),m(u,g),m(d,g)],w:u-d,h:g-f}}}return t||{corners:[i[0],i[0],i[0],i[0]],w:0,h:0}}function Qx(i){let e=Sf(i),t=e.length?e:i,n=(a,c)=>[(a[0]+c[0])/2,(a[1]+c[1])/2,Math.hypot(a[0]-c[0],a[1]-c[1])/2],s=(a,c,l)=>{let h=2*(a[0]*(c[1]-l[1])+c[0]*(l[1]-a[1])+l[0]*(a[1]-c[1]));if(Math.abs(h)<1e-12)return[n(a,c),n(a,l),n(c,l)].sort((p,x)=>x[2]-p[2])[0];let d=a[0]**2+a[1]**2,u=c[0]**2+c[1]**2,f=l[0]**2+l[1]**2,g=(d*(c[1]-l[1])+u*(l[1]-a[1])+f*(a[1]-c[1]))/h,b=(d*(l[0]-c[0])+u*(a[0]-l[0])+f*(c[0]-a[0]))/h;return[g,b,Math.hypot(a[0]-g,a[1]-b)]},r=(a,c)=>Math.hypot(c[0]-a[0],c[1]-a[1])<=a[2]+1e-9,o=[t[0][0],t[0][1],0];for(let a=1;a<t.length;a++)if(!r(o,t[a])){o=[t[a][0],t[a][1],0];for(let c=0;c<a;c++)if(!r(o,t[c])){o=n(t[a],t[c]);for(let l=0;l<c;l++)r(o,t[l])||(o=s(t[a],t[c],t[l]))}}return o[2]}function eb(i,e,t,n,s,r=16){if(Math.abs(n[2])<.8)return[null,180];let o=ys(e),a=ys(t),c=Math.max(0,o-r),l=Math.min(i.camera.width,o+r+1),h=Math.max(0,a-r),d=Math.min(i.camera.height,a+r+1),u=[];for(let C=h;C<d;C++)for(let F=c;F<l;F++){let H=i.at(F,C);H<=0||Math.abs(zn(Bn(i.world(F,C,H),s),n))<.003&&u.push([F,C])}if(u.length<30)return[null,180];let f=Math.min(...u.map(C=>C[0])),g=Math.max(...u.map(C=>C[0])),b=Math.min(...u.map(C=>C[1])),m=Math.max(...u.map(C=>C[1])),p=1/0,x=-1/0,R=1/0,S=-1/0;for(let C=h;C<d;C++)for(let F=c;F<l;F++)i.at(F,C)>0&&(p=Math.min(p,F),x=Math.max(x,F),R=Math.min(R,C),S=Math.max(S,C));if(f<=p+1||g>=x-1||b<=R+1||m>=S-1)return[null,180];let M=Zx(u);if(M.w*M.h<1e-6||u.length/(M.w*M.h)<.85)return[null,180];let w=Qx(u);if(w>0&&u.length/(Math.PI*w*w)>.8)return[null,180];let E=M.corners.map(([C,F])=>{let[H,V]=th(i.camera,C,F),q=zn(n,Bn(s,H))/zn(n,V);return[H[0]+V[0]*q,H[1]+V[1]*q,H[2]+V[2]*q]}),y=Bn(E[1],E[0]),T=Bn(E[2],E[1]),P=Math.hypot(y[0],y[1],y[2]),I=Math.hypot(T[0],T[1],T[2]);if(Math.min(P,I)<1e-4)return[null,180];let k=P>=I?y:T,L=Math.hypot(k[0],k[1]);return L<1e-6?[null,180]:[[k[0]/L,k[1]/L,0],Math.max(P,I)/Math.min(P,I)<1.2?90:180]}function Mf(i,e,t,n){let s=vf(t,0,i.camera.width-1),r=vf(n,0,i.camera.height-1),o=jx(i,s,r,3,20),a=i.world(s,r,o),c=Kx(i,s,r,4,o),l=null,h=null,d=180;if(c){let{n:u,c:f,rms:g}=c;l=u;let[b,m]=th(i.camera,s,r),p=-zn(u,m);if(g<.002&&p>.25){let x=zn(u,Bn(f,b))/zn(u,m);a=[b[0]+m[0]*x,b[1]+m[1]*x,b[2]+m[2]*x],[h,d]=eb(i,s,r,u,f)}}return{name:e,pos:a,normal:l??[0,0,1],axis:h,axis_sym:d}}var ys,vf,vr,ja,Bn,zn,Yx,Jx,wf=zt(()=>{"use strict";Un();ys=i=>{let e=Math.round(i);return Math.abs(i%1)===.5&&e%2!==0?e-1:e},vf=(i,e,t)=>Math.min(t,Math.max(e,i)),vr=class extends Error{};ja=class{constructor(e,t){this.env=e;this.camera=t}cache=new Map;at(e,t){let{width:n,height:s}=this.camera;if(e<0||t<0||e>=n||t>=s)return 0;let r=t*n+e,o=this.cache.get(r);if(o===void 0){let a=this.camera,[c,l]=th(a,e,t),h=this.env.castRay(c,l);o=h===null?0:h/Math.hypot((e-a.cx)/a.fx,(t-a.cy)/a.fy,1),this.cache.set(r,o)}return o}world(e,t,n){let s=this.camera,r=s.T_world_cam,o=(e-s.cx)/s.fx*n,a=-(t-s.cy)/s.fy*n,c=-n;return[r[0]*o+r[1]*a+r[2]*c+r[3],r[4]*o+r[5]*a+r[6]*c+r[7],r[8]*o+r[9]*a+r[10]*c+r[11]]}};Bn=(i,e)=>[i[0]-e[0],i[1]-e[1],i[2]-e[2]],zn=(i,e)=>i[0]*e[0]+i[1]*e[1]+i[2]*e[2];Yx=(i,e)=>{let t=0,n=[0,0,0];return i.forEach((s,r)=>{e[r]&&(t++,n[0]+=s[0],n[1]+=s[1],n[2]+=s[2])}),[n[0]/t,n[1]/t,n[2]/t]},Jx=i=>nh(i,50)});var Tf={};Ar(Tf,{CROP:()=>xs,VisionGrounder:()=>ih,ZOOM:()=>Sr});var xs,Sr,ih,Af=zt(()=>{"use strict";dr();$a();wf();cr();xs=96,Sr=5,ih=class extends Ci{constructor(t,n,s,r,o=1,a){super(t,n,a,"vision_grounder");this.env=s;this.codec=r;this.refineIters=o}name="vision_grounder";schema=Ed;lastPixels={};async point(t,n,s,r,o=""){let{width:a,height:c}=t,l=n.map(b=>`- ${b.name}: ${b.description}`).join(`
`),h=`Image size: ${a} x ${c} pixels (u to the right, v downward).${o}
Locate these keypoints:
${l}`,d=b=>{let m=new Set(b.points.map(x=>x.name)),p=n.map(x=>x.name).filter(x=>!m.has(x)).sort();if(p.length)throw new Ie(`missing keypoints ${JSON.stringify(p)}`);for(let x of b.points)if(!(x.u>=0&&x.u<=a&&x.v>=0&&x.v<=c))throw new Ie(`${x.name}=(${x.u},${x.v}) is outside the ${a}x${c} image`)},u=await this.codec.encode(Zl(t,s)),f={type:"image",mediaType:"image/png",load:async()=>u},g=await this.call([h,f],d,2,r);return Object.fromEntries(g.points.map(b=>[b.name,[b.u,b.v,b.visible]]))}async zoomRefine(t,n,s,r){let o=(f,g)=>Math.min(g,Math.max(0,f)),a=o(Math.round(s)-xs/2,t.width-xs),c=o(Math.round(r)-xs/2,t.height-xs),l=Ql(t,a,c,xs,Sr),h=await this.point(l,[n],Sr*12,`refine:${n.name}`," This is a zoomed crop of the scene; the feature should be near the middle."),[d,u]=h[n.name];return[a+d/Sr,c+u/Sr]}async ground(t,n){if(!t.length)return{};let s=await n.png();if(!s)throw new On("Vision grounding needs the camera renderer, which this browser (or WebGL in a worker) does not provide. Use the Oracle grounding instead.");let r=await this.codec.decode(s),o=new ja(this.env,n.camera),a=await this.point(r,t,80,"coarse"),c={};this.lastPixels={};for(let l of t){let[h,d]=a[l.name];for(let u=0;u<this.refineIters;u++)[h,d]=await this.zoomRefine(r,l,h,d);this.lastPixels[l.name]=[h,d];try{c[l.name]=Mf(o,l.name,h,d)}catch(u){throw u instanceof vr?new On(`${l.name}: ${u.message}`):u}}return c}}});var Oh=0,Cc=1,Bh=2;var Xs=1,zh=2,ts=3,Sn=0,Ot=1,en=2,Mn=0,ns=1,Pc=2,Ic=3,Lc=4,Vh=5;var vi=100,Gh=101,Hh=102,Wh=103,Xh=104,$h=200,jh=201,qh=202,Yh=203,kc=204,Dc=205,Jh=206,Kh=207,Zh=208,Qh=209,eu=210,tu=211,nu=212,iu=213,su=214,qr=0,Yr=1,Jr=2,ji=3,Kr=4,Zr=5,Qr=6,eo=7,Nc=0,ru=1,ou=2,ln=0,Uc=1,Fc=2,Oc=3,Bc=4,zc=5,Vc=6,Gc=7;var Hc=300,ii=301,Si=302,Ro=303,Co=304,$s=306,to=1e3,_n=1001,no=1002,St=1003,au=1004;var js=1005;var Tt=1006,Po=1007;var si=1008;var $t=1009,Wc=1010,Xc=1011,is=1012,Io=1013,hn=1014,un=1015,dn=1016,Lo=1017,ko=1018,ss=1020,$c=35902,jc=35899,qc=1021,Yc=1022,tn=1023,xn=1026,ri=1027,Jc=1028,Do=1029,oi=1030,No=1031;var Uo=1033,qs=33776,Ys=33777,Js=33778,Ks=33779,Fo=35840,Oo=35841,Bo=35842,zo=35843,Vo=36196,Go=37492,Ho=37496,Wo=37488,Xo=37489,Zs=37490,$o=37491,jo=37808,qo=37809,Yo=37810,Jo=37811,Ko=37812,Zo=37813,Qo=37814,ea=37815,ta=37816,na=37817,ia=37818,sa=37819,ra=37820,oa=37821,aa=36492,ca=36494,la=36495,ha=36283,ua=36284,Qs=36285,da=36286;var Ts=2300,io=2301,$r=2302,Sc=2303,Mc=2400,wc=2401,Tc=2402;var cu=3200;var fa=0,lu=1,Dn="",Ut="srgb",As="srgb-linear",Es="linear",Ze="srgb";var jr=7680;var hu=519,uu=512,du=513,fu=514,pa=515,pu=516,mu=517,ma=518,gu=519,_u=35044;var Kc="300 es",cn=2e3,qi=2001;function Ff(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function Of(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function Rs(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function yu(){let i=Rs("canvas");return i.style.display="block",i}var _h={},Yi=null;function Zc(...i){let e="THREE."+i.shift();Yi?Yi("log",e,...i):console.log(e,...i)}function xu(i){let e=i[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=i[1];t&&t.isStackTrace?i[0]+=" "+t.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Ce(...i){i=xu(i);let e="THREE."+i.shift();if(Yi)Yi("warn",e,...i);else{let t=i[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...i)}}function Pe(...i){i=xu(i);let e="THREE."+i.shift();if(Yi)Yi("error",e,...i);else{let t=i[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...i)}}function xi(...i){let e=i.join(" ");e in _h||(_h[e]=!0,Ce(...i))}function bu(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}var vu={[qr]:Yr,[Jr]:Qr,[Kr]:eo,[ji]:Zr,[Yr]:qr,[Qr]:Jr,[eo]:Kr,[Zr]:ji},bn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let s=n[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,e);e.target=null}}},Rt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var Qa=Math.PI/180,so=180/Math.PI;function er(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Rt[i&255]+Rt[i>>8&255]+Rt[i>>16&255]+Rt[i>>24&255]+"-"+Rt[e&255]+Rt[e>>8&255]+"-"+Rt[e>>16&15|64]+Rt[e>>24&255]+"-"+Rt[t&63|128]+Rt[t>>8&255]+"-"+Rt[t>>16&255]+Rt[t>>24&255]+Rt[n&255]+Rt[n>>8&255]+Rt[n>>16&255]+Rt[n>>24&255]).toLowerCase()}function Xe(i,e,t){return Math.max(e,Math.min(t,i))}function Bf(i,e){return(i%e+e)%e}function ec(i,e,t){return(1-t)*i+t*e}function bs(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:case Uint8ClampedArray:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Vt(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var We=class i{static{i.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Xe(this.x,e.x,t.x),this.y=Xe(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Xe(this.x,e,t),this.y=Xe(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Xe(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Xe(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*n-o*s+e.x,this.y=r*s+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},vn=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,o,a){let c=n[s+0],l=n[s+1],h=n[s+2],d=n[s+3],u=r[o+0],f=r[o+1],g=r[o+2],b=r[o+3];if(d!==b||c!==u||l!==f||h!==g){let m=c*u+l*f+h*g+d*b;m<0&&(u=-u,f=-f,g=-g,b=-b,m=-m);let p=1-a;if(m<.9995){let x=Math.acos(m),R=Math.sin(x);p=Math.sin(p*x)/R,a=Math.sin(a*x)/R,c=c*p+u*a,l=l*p+f*a,h=h*p+g*a,d=d*p+b*a}else{c=c*p+u*a,l=l*p+f*a,h=h*p+g*a,d=d*p+b*a;let x=1/Math.sqrt(c*c+l*l+h*h+d*d);c*=x,l*=x,h*=x,d*=x}}e[t]=c,e[t+1]=l,e[t+2]=h,e[t+3]=d}static multiplyQuaternionsFlat(e,t,n,s,r,o){let a=n[s],c=n[s+1],l=n[s+2],h=n[s+3],d=r[o],u=r[o+1],f=r[o+2],g=r[o+3];return e[t]=a*g+h*d+c*f-l*u,e[t+1]=c*g+h*u+l*d-a*f,e[t+2]=l*g+h*f+a*u-c*d,e[t+3]=h*g-a*d-c*u-l*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,o=e._order,a=Math.cos,c=Math.sin,l=a(n/2),h=a(s/2),d=a(r/2),u=c(n/2),f=c(s/2),g=c(r/2);switch(o){case"XYZ":this._x=u*h*d+l*f*g,this._y=l*f*d-u*h*g,this._z=l*h*g+u*f*d,this._w=l*h*d-u*f*g;break;case"YXZ":this._x=u*h*d+l*f*g,this._y=l*f*d-u*h*g,this._z=l*h*g-u*f*d,this._w=l*h*d+u*f*g;break;case"ZXY":this._x=u*h*d-l*f*g,this._y=l*f*d+u*h*g,this._z=l*h*g+u*f*d,this._w=l*h*d-u*f*g;break;case"ZYX":this._x=u*h*d-l*f*g,this._y=l*f*d+u*h*g,this._z=l*h*g-u*f*d,this._w=l*h*d+u*f*g;break;case"YZX":this._x=u*h*d+l*f*g,this._y=l*f*d+u*h*g,this._z=l*h*g-u*f*d,this._w=l*h*d-u*f*g;break;case"XZY":this._x=u*h*d-l*f*g,this._y=l*f*d-u*h*g,this._z=l*h*g+u*f*d,this._w=l*h*d+u*f*g;break;default:Ce("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],o=t[1],a=t[5],c=t[9],l=t[2],h=t[6],d=t[10],u=n+a+d;if(u>0){let f=.5/Math.sqrt(u+1);this._w=.25/f,this._x=(h-c)*f,this._y=(r-l)*f,this._z=(o-s)*f}else if(n>a&&n>d){let f=2*Math.sqrt(1+n-a-d);this._w=(h-c)/f,this._x=.25*f,this._y=(s+o)/f,this._z=(r+l)/f}else if(a>d){let f=2*Math.sqrt(1+a-n-d);this._w=(r-l)/f,this._x=(s+o)/f,this._y=.25*f,this._z=(c+h)/f}else{let f=2*Math.sqrt(1+d-n-a);this._w=(o-s)/f,this._x=(r+l)/f,this._y=(c+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Xe(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,o=e._w,a=t._x,c=t._y,l=t._z,h=t._w;return this._x=n*h+o*a+s*l-r*c,this._y=s*h+o*c+r*a-n*l,this._z=r*h+o*l+n*c-s*a,this._w=o*h-n*a-s*c-r*l,this._onChangeCallback(),this}slerp(e,t){let n=e._x,s=e._y,r=e._z,o=e._w,a=this.dot(e);a<0&&(n=-n,s=-s,r=-r,o=-o,a=-a);let c=1-t;if(a<.9995){let l=Math.acos(a),h=Math.sin(l);c=Math.sin(c*l)/h,t=Math.sin(t*l)/h,this._x=this._x*c+n*t,this._y=this._y*c+s*t,this._z=this._z*c+r*t,this._w=this._w*c+o*t,this._onChangeCallback()}else this._x=this._x*c+n*t,this._y=this._y*c+s*t,this._z=this._z*c+r*t,this._w=this._w*c+o*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},G=class i{static{i.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(yh.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(yh.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,o=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,o=e.y,a=e.z,c=e.w,l=2*(o*s-a*n),h=2*(a*t-r*s),d=2*(r*n-o*t);return this.x=t+c*l+o*d-a*h,this.y=n+c*h+a*l-r*d,this.z=s+c*d+r*h-o*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Xe(this.x,e.x,t.x),this.y=Xe(this.y,e.y,t.y),this.z=Xe(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Xe(this.x,e,t),this.y=Xe(this.y,e,t),this.z=Xe(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Xe(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,o=t.x,a=t.y,c=t.z;return this.x=s*c-r*a,this.y=r*o-n*c,this.z=n*a-s*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return tc.copy(this).projectOnVector(e),this.sub(tc)}reflect(e){return this.sub(tc.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Xe(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},tc=new G,yh=new vn,Le=class i{static{i.prototype.isMatrix3=!0}constructor(e,t,n,s,r,o,a,c,l){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,o,a,c,l)}set(e,t,n,s,r,o,a,c,l){let h=this.elements;return h[0]=e,h[1]=s,h[2]=a,h[3]=t,h[4]=r,h[5]=c,h[6]=n,h[7]=o,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,o=n[0],a=n[3],c=n[6],l=n[1],h=n[4],d=n[7],u=n[2],f=n[5],g=n[8],b=s[0],m=s[3],p=s[6],x=s[1],R=s[4],S=s[7],M=s[2],w=s[5],E=s[8];return r[0]=o*b+a*x+c*M,r[3]=o*m+a*R+c*w,r[6]=o*p+a*S+c*E,r[1]=l*b+h*x+d*M,r[4]=l*m+h*R+d*w,r[7]=l*p+h*S+d*E,r[2]=u*b+f*x+g*M,r[5]=u*m+f*R+g*w,r[8]=u*p+f*S+g*E,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],h=e[8];return t*o*h-t*a*l-n*r*h+n*a*c+s*r*l-s*o*c}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],h=e[8],d=h*o-a*l,u=a*c-h*r,f=l*r-o*c,g=t*d+n*u+s*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let b=1/g;return e[0]=d*b,e[1]=(s*l-h*n)*b,e[2]=(a*n-s*o)*b,e[3]=u*b,e[4]=(h*t-s*c)*b,e[5]=(s*r-a*t)*b,e[6]=f*b,e[7]=(n*c-l*t)*b,e[8]=(o*t-n*r)*b,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,o,a){let c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*o+l*a)+o+e,-s*l,s*c,-s*(-l*o+c*a)+a+t,0,0,1),this}scale(e,t){return xi("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(nc.makeScale(e,t)),this}rotate(e){return xi("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(nc.makeRotation(-e)),this}translate(e,t){return xi("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(nc.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},nc=new Le,xh=new Le().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),bh=new Le().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function zf(){let i={enabled:!0,workingColorSpace:As,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===Ze&&(s.r=Ln(s.r),s.g=Ln(s.g),s.b=Ln(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===Ze&&(s.r=$i(s.r),s.g=$i(s.g),s.b=$i(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Dn?Es:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return xi("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return xi("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[As]:{primaries:e,whitePoint:n,transfer:Es,toXYZ:xh,fromXYZ:bh,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Ut},outputColorSpaceConfig:{drawingBufferColorSpace:Ut}},[Ut]:{primaries:e,whitePoint:n,transfer:Ze,toXYZ:xh,fromXYZ:bh,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Ut}}}),i}var He=zf();function Ln(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function $i(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var ki,ro=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{ki===void 0&&(ki=Rs("canvas")),ki.width=e.width,ki.height=e.height;let s=ki.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),n=ki}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Rs("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=Ln(r[o]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Ln(t[n]/255)*255):t[n]=Ln(t[n]);return{data:t,width:e.width,height:e.height}}else return Ce("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Vf=0,Ji=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Vf++}),this.uuid=er(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(ic(s[o].image)):r.push(ic(s[o]))}else r=ic(s);n.url=r}return t||(e.images[this.uuid]=n),n}};function ic(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?ro.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Ce("Texture: Unable to serialize Texture."),{})}var Gf=0,sc=new G,Gt=class i extends bn{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=_n,s=_n,r=Tt,o=si,a=tn,c=$t,l=i.DEFAULT_ANISOTROPY,h=Dn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Gf++}),this.uuid=er(),this.name="",this.source=new Ji(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new We(0,0),this.repeat=new We(1,1),this.center=new We(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Le,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(sc).x}get height(){return this.source.getSize(sc).y}get depth(){return this.source.getSize(sc).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){Ce(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){Ce(`Texture.setValues(): property '${t}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Hc)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case to:e.x=e.x-Math.floor(e.x);break;case _n:e.x=e.x<0?0:1;break;case no:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case to:e.y=e.y-Math.floor(e.y);break;case _n:e.y=e.y<0?0:1;break;case no:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Gt.DEFAULT_IMAGE=null;Gt.DEFAULT_MAPPING=Hc;Gt.DEFAULT_ANISOTROPY=1;var ht=class i{static{i.prototype.isVector4=!0}constructor(e=0,t=0,n=0,s=1){this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*t+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*t+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*t+o[7]*n+o[11]*s+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,c=e.elements,l=c[0],h=c[4],d=c[8],u=c[1],f=c[5],g=c[9],b=c[2],m=c[6],p=c[10];if(Math.abs(h-u)<.01&&Math.abs(d-b)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+b)<.1&&Math.abs(g+m)<.1&&Math.abs(l+f+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let R=(l+1)/2,S=(f+1)/2,M=(p+1)/2,w=(h+u)/4,E=(d+b)/4,y=(g+m)/4;return R>S&&R>M?R<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(R),s=w/n,r=E/n):S>M?S<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(S),n=w/s,r=y/s):M<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(M),n=E/r,s=y/r),this.set(n,s,r,t),this}let x=Math.sqrt((m-g)*(m-g)+(d-b)*(d-b)+(u-h)*(u-h));return Math.abs(x)<.001&&(x=1),this.x=(m-g)/x,this.y=(d-b)/x,this.z=(u-h)/x,this.w=Math.acos((l+f+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Xe(this.x,e.x,t.x),this.y=Xe(this.y,e.y,t.y),this.z=Xe(this.z,e.z,t.z),this.w=Xe(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Xe(this.x,e,t),this.y=Xe(this.y,e,t),this.z=Xe(this.z,e,t),this.w=Xe(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Xe(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},oo=class extends bn{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Tt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new ht(0,0,e,t),this.scissorTest=!1,this.viewport=new ht(0,0,e,t),this.textures=[];let s={width:e,height:t,depth:n.depth},r=new Gt(s),o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:Tt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new Ji(s)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},Ht=class extends oo{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Cs=class extends Gt{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=St,this.minFilter=St,this.wrapR=_n,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var ao=class extends Gt{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=St,this.minFilter=St,this.wrapR=_n,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}};var ct=class i{static{i.prototype.isMatrix4=!0}constructor(e,t,n,s,r,o,a,c,l,h,d,u,f,g,b,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,o,a,c,l,h,d,u,f,g,b,m)}set(e,t,n,s,r,o,a,c,l,h,d,u,f,g,b,m){let p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=c,p[2]=l,p[6]=h,p[10]=d,p[14]=u,p[3]=f,p[7]=g,p[11]=b,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,s=1/Di.setFromMatrixColumn(e,0).length(),r=1/Di.setFromMatrixColumn(e,1).length(),o=1/Di.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,o=Math.cos(n),a=Math.sin(n),c=Math.cos(s),l=Math.sin(s),h=Math.cos(r),d=Math.sin(r);if(e.order==="XYZ"){let u=o*h,f=o*d,g=a*h,b=a*d;t[0]=c*h,t[4]=-c*d,t[8]=l,t[1]=f+g*l,t[5]=u-b*l,t[9]=-a*c,t[2]=b-u*l,t[6]=g+f*l,t[10]=o*c}else if(e.order==="YXZ"){let u=c*h,f=c*d,g=l*h,b=l*d;t[0]=u+b*a,t[4]=g*a-f,t[8]=o*l,t[1]=o*d,t[5]=o*h,t[9]=-a,t[2]=f*a-g,t[6]=b+u*a,t[10]=o*c}else if(e.order==="ZXY"){let u=c*h,f=c*d,g=l*h,b=l*d;t[0]=u-b*a,t[4]=-o*d,t[8]=g+f*a,t[1]=f+g*a,t[5]=o*h,t[9]=b-u*a,t[2]=-o*l,t[6]=a,t[10]=o*c}else if(e.order==="ZYX"){let u=o*h,f=o*d,g=a*h,b=a*d;t[0]=c*h,t[4]=g*l-f,t[8]=u*l+b,t[1]=c*d,t[5]=b*l+u,t[9]=f*l-g,t[2]=-l,t[6]=a*c,t[10]=o*c}else if(e.order==="YZX"){let u=o*c,f=o*l,g=a*c,b=a*l;t[0]=c*h,t[4]=b-u*d,t[8]=g*d+f,t[1]=d,t[5]=o*h,t[9]=-a*h,t[2]=-l*h,t[6]=f*d+g,t[10]=u-b*d}else if(e.order==="XZY"){let u=o*c,f=o*l,g=a*c,b=a*l;t[0]=c*h,t[4]=-d,t[8]=l*h,t[1]=u*d+b,t[5]=o*h,t[9]=f*d-g,t[2]=g*d-f,t[6]=a*h,t[10]=b*d+u}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Hf,e,Wf)}lookAt(e,t,n){let s=this.elements;return jt.subVectors(e,t),jt.lengthSq()===0&&(jt.z=1),jt.normalize(),Wn.crossVectors(n,jt),Wn.lengthSq()===0&&(Math.abs(n.z)===1?jt.x+=1e-4:jt.z+=1e-4,jt.normalize(),Wn.crossVectors(n,jt)),Wn.normalize(),Er.crossVectors(jt,Wn),s[0]=Wn.x,s[4]=Er.x,s[8]=jt.x,s[1]=Wn.y,s[5]=Er.y,s[9]=jt.y,s[2]=Wn.z,s[6]=Er.z,s[10]=jt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,o=n[0],a=n[4],c=n[8],l=n[12],h=n[1],d=n[5],u=n[9],f=n[13],g=n[2],b=n[6],m=n[10],p=n[14],x=n[3],R=n[7],S=n[11],M=n[15],w=s[0],E=s[4],y=s[8],T=s[12],P=s[1],I=s[5],k=s[9],L=s[13],C=s[2],F=s[6],H=s[10],V=s[14],q=s[3],X=s[7],K=s[11],Z=s[15];return r[0]=o*w+a*P+c*C+l*q,r[4]=o*E+a*I+c*F+l*X,r[8]=o*y+a*k+c*H+l*K,r[12]=o*T+a*L+c*V+l*Z,r[1]=h*w+d*P+u*C+f*q,r[5]=h*E+d*I+u*F+f*X,r[9]=h*y+d*k+u*H+f*K,r[13]=h*T+d*L+u*V+f*Z,r[2]=g*w+b*P+m*C+p*q,r[6]=g*E+b*I+m*F+p*X,r[10]=g*y+b*k+m*H+p*K,r[14]=g*T+b*L+m*V+p*Z,r[3]=x*w+R*P+S*C+M*q,r[7]=x*E+R*I+S*F+M*X,r[11]=x*y+R*k+S*H+M*K,r[15]=x*T+R*L+S*V+M*Z,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],o=e[1],a=e[5],c=e[9],l=e[13],h=e[2],d=e[6],u=e[10],f=e[14],g=e[3],b=e[7],m=e[11],p=e[15],x=c*f-l*u,R=a*f-l*d,S=a*u-c*d,M=o*f-l*h,w=o*u-c*h,E=o*d-a*h;return t*(b*x-m*R+p*S)-n*(g*x-m*M+p*w)+s*(g*R-b*M+p*E)-r*(g*S-b*w+m*E)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[1],o=e[5],a=e[9],c=e[2],l=e[6],h=e[10];return t*(o*h-a*l)-n*(r*h-a*c)+s*(r*l-o*c)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],h=e[8],d=e[9],u=e[10],f=e[11],g=e[12],b=e[13],m=e[14],p=e[15],x=t*a-n*o,R=t*c-s*o,S=t*l-r*o,M=n*c-s*a,w=n*l-r*a,E=s*l-r*c,y=h*b-d*g,T=h*m-u*g,P=h*p-f*g,I=d*m-u*b,k=d*p-f*b,L=u*p-f*m,C=x*L-R*k+S*I+M*P-w*T+E*y;if(C===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let F=1/C;return e[0]=(a*L-c*k+l*I)*F,e[1]=(s*k-n*L-r*I)*F,e[2]=(b*E-m*w+p*M)*F,e[3]=(u*w-d*E-f*M)*F,e[4]=(c*P-o*L-l*T)*F,e[5]=(t*L-s*P+r*T)*F,e[6]=(m*S-g*E-p*R)*F,e[7]=(h*E-u*S+f*R)*F,e[8]=(o*k-a*P+l*y)*F,e[9]=(n*P-t*k-r*y)*F,e[10]=(g*w-b*S+p*x)*F,e[11]=(d*S-h*w-f*x)*F,e[12]=(a*T-o*I-c*y)*F,e[13]=(t*I-n*T+s*y)*F,e[14]=(b*R-g*M-m*x)*F,e[15]=(h*M-d*R+u*x)*F,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,o=e.x,a=e.y,c=e.z,l=r*o,h=r*a;return this.set(l*o+n,l*a-s*c,l*c+s*a,0,l*a+s*c,h*a+n,h*c-s*o,0,l*c-s*a,h*c+s*o,r*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,o){return this.set(1,n,r,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,o=t._y,a=t._z,c=t._w,l=r+r,h=o+o,d=a+a,u=r*l,f=r*h,g=r*d,b=o*h,m=o*d,p=a*d,x=c*l,R=c*h,S=c*d,M=n.x,w=n.y,E=n.z;return s[0]=(1-(b+p))*M,s[1]=(f+S)*M,s[2]=(g-R)*M,s[3]=0,s[4]=(f-S)*w,s[5]=(1-(u+p))*w,s[6]=(m+x)*w,s[7]=0,s[8]=(g+R)*E,s[9]=(m-x)*E,s[10]=(1-(u+b))*E,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements;e.x=s[12],e.y=s[13],e.z=s[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),t.identity(),this;let o=Di.set(s[0],s[1],s[2]).length(),a=Di.set(s[4],s[5],s[6]).length(),c=Di.set(s[8],s[9],s[10]).length();r<0&&(o=-o),sn.copy(this);let l=1/o,h=1/a,d=1/c;return sn.elements[0]*=l,sn.elements[1]*=l,sn.elements[2]*=l,sn.elements[4]*=h,sn.elements[5]*=h,sn.elements[6]*=h,sn.elements[8]*=d,sn.elements[9]*=d,sn.elements[10]*=d,t.setFromRotationMatrix(sn),n.x=o,n.y=a,n.z=c,this}makePerspective(e,t,n,s,r,o,a=cn,c=!1){let l=this.elements,h=2*r/(t-e),d=2*r/(n-s),u=(t+e)/(t-e),f=(n+s)/(n-s),g,b;if(c)g=r/(o-r),b=o*r/(o-r);else if(a===cn)g=-(o+r)/(o-r),b=-2*o*r/(o-r);else if(a===qi)g=-o/(o-r),b=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=h,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=d,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=g,l[14]=b,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,s,r,o,a=cn,c=!1){let l=this.elements,h=2/(t-e),d=2/(n-s),u=-(t+e)/(t-e),f=-(n+s)/(n-s),g,b;if(c)g=1/(o-r),b=o/(o-r);else if(a===cn)g=-2/(o-r),b=-(o+r)/(o-r);else if(a===qi)g=-1/(o-r),b=-r/(o-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=h,l[4]=0,l[8]=0,l[12]=u,l[1]=0,l[5]=d,l[9]=0,l[13]=f,l[2]=0,l[6]=0,l[10]=g,l[14]=b,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Di=new G,sn=new ct,Hf=new G(0,0,0),Wf=new G(1,1,1),Wn=new G,Er=new G,jt=new G,vh=new ct,Sh=new vn,kn=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],o=s[4],a=s[8],c=s[1],l=s[5],h=s[9],d=s[2],u=s[6],f=s[10];switch(t){case"XYZ":this._y=Math.asin(Xe(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(u,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Xe(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(Xe(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,f),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-Xe(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,f),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(Xe(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-Xe(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(u,l),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:Ce("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return vh.makeRotationFromQuaternion(e),this.setFromRotationMatrix(vh,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Sh.setFromEuler(this),this.setFromQuaternion(Sh,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};kn.DEFAULT_ORDER="XYZ";var Ps=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Xf=0,Mh=new G,Ni=new vn,En=new ct,Rr=new G,vs=new G,$f=new G,jf=new vn,wh=new G(1,0,0),Th=new G(0,1,0),Ah=new G(0,0,1),Eh={type:"added"},qf={type:"removed"},Ui={type:"childadded",child:null},rc={type:"childremoved",child:null},It=class i extends bn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Xf++}),this.uuid=er(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new G,t=new kn,n=new vn,s=new G(1,1,1);function r(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ct},normalMatrix:{value:new Le}}),this.matrix=new ct,this.matrixWorld=new ct,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ps,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ni.setFromAxisAngle(e,t),this.quaternion.multiply(Ni),this}rotateOnWorldAxis(e,t){return Ni.setFromAxisAngle(e,t),this.quaternion.premultiply(Ni),this}rotateX(e){return this.rotateOnAxis(wh,e)}rotateY(e){return this.rotateOnAxis(Th,e)}rotateZ(e){return this.rotateOnAxis(Ah,e)}translateOnAxis(e,t){return Mh.copy(e).applyQuaternion(this.quaternion),this.position.add(Mh.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(wh,e)}translateY(e){return this.translateOnAxis(Th,e)}translateZ(e){return this.translateOnAxis(Ah,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(En.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Rr.copy(e):Rr.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),vs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?En.lookAt(vs,Rr,this.up):En.lookAt(Rr,vs,this.up),this.quaternion.setFromRotationMatrix(En),s&&(En.extractRotation(s.matrixWorld),Ni.setFromRotationMatrix(En),this.quaternion.premultiply(Ni.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Pe("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Eh),Ui.child=e,this.dispatchEvent(Ui),Ui.child=null):Pe("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(qf),rc.child=e,this.dispatchEvent(rc),rc.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),En.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),En.multiply(e.parent.matrixWorld)),e.applyMatrix4(En),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Eh),Ui.child=e,this.dispatchEvent(Ui),Ui.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(vs,e,$f),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(vs,jf,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,s=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*n-r[8]*s,r[13]+=n-r[1]*t-r[5]*n-r[9]*s,r[14]+=s-r[2]*t-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let s=this.parent;if(e===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let r=this.children;for(let o=0,a=r.length;o<a;o++)r[o].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(a=>({...a})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let c=a.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){let d=c[l];r(e.shapes,d)}else r(e.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(r(e.materials,this.material[c]));s.material=a}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let c=this.animations[a];s.animations.push(r(e.animations,c))}}if(t){let a=o(e.geometries),c=o(e.materials),l=o(e.textures),h=o(e.images),d=o(e.shapes),u=o(e.skeletons),f=o(e.animations),g=o(e.nodes);a.length>0&&(n.geometries=a),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),h.length>0&&(n.images=h),d.length>0&&(n.shapes=d),u.length>0&&(n.skeletons=u),f.length>0&&(n.animations=f),g.length>0&&(n.nodes=g)}return n.object=s,n;function o(a){let c=[];for(let l in a){let h=a[l];delete h.metadata,c.push(h)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};It.DEFAULT_UP=new G(0,1,0);It.DEFAULT_MATRIX_AUTO_UPDATE=!0;It.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var yn=class extends It{constructor(){super(),this.isGroup=!0,this.type="Group"}},Yf={type:"move"},Ki=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new yn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new yn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new G,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new G),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new yn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new G,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new G,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,o=null,a=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){o=!0;for(let b of e.hand.values()){let m=t.getJointPose(b,n),p=this._getHandJoint(l,b);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}let h=l.joints["index-finger-tip"],d=l.joints["thumb-tip"],u=h.position.distanceTo(d.position),f=.02,g=.005;l.inputState.pinching&&u>f+g?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&u<=f-g&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:e,target:this})));a!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Yf)))}return a!==null&&(a.visible=s!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new yn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},Su={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Xn={h:0,s:0,l:0},Cr={h:0,s:0,l:0};function oc(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var Fe=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Ut){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,He.colorSpaceToWorking(this,t),this}setRGB(e,t,n,s=He.workingColorSpace){return this.r=e,this.g=t,this.b=n,He.colorSpaceToWorking(this,s),this}setHSL(e,t,n,s=He.workingColorSpace){if(e=Bf(e,1),t=Xe(t,0,1),n=Xe(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,o=2*n-r;this.r=oc(o,r,e+1/3),this.g=oc(o,r,e),this.b=oc(o,r,e-1/3)}return He.colorSpaceToWorking(this,s),this}setStyle(e,t=Ut){function n(r){r!==void 0&&parseFloat(r)<1&&Ce("Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:Ce("Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);Ce("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Ut){let n=Su[e.toLowerCase()];return n!==void 0?this.setHex(n,t):Ce("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Ln(e.r),this.g=Ln(e.g),this.b=Ln(e.b),this}copyLinearToSRGB(e){return this.r=$i(e.r),this.g=$i(e.g),this.b=$i(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Ut){return He.workingToColorSpace(Ct.copy(this),e),Math.round(Xe(Ct.r*255,0,255))*65536+Math.round(Xe(Ct.g*255,0,255))*256+Math.round(Xe(Ct.b*255,0,255))}getHexString(e=Ut){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=He.workingColorSpace){He.workingToColorSpace(Ct.copy(this),t);let n=Ct.r,s=Ct.g,r=Ct.b,o=Math.max(n,s,r),a=Math.min(n,s,r),c,l,h=(a+o)/2;if(a===o)c=0,l=0;else{let d=o-a;switch(l=h<=.5?d/(o+a):d/(2-o-a),o){case n:c=(s-r)/d+(s<r?6:0);break;case s:c=(r-n)/d+2;break;case r:c=(n-s)/d+4;break}c/=6}return e.h=c,e.s=l,e.l=h,e}getRGB(e,t=He.workingColorSpace){return He.workingToColorSpace(Ct.copy(this),t),e.r=Ct.r,e.g=Ct.g,e.b=Ct.b,e}getStyle(e=Ut){He.workingToColorSpace(Ct.copy(this),e);let t=Ct.r,n=Ct.g,s=Ct.b;return e!==Ut?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(Xn),this.setHSL(Xn.h+e,Xn.s+t,Xn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Xn),e.getHSL(Cr);let n=ec(Xn.h,Cr.h,t),s=ec(Xn.s,Cr.s,t),r=ec(Xn.l,Cr.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Ct=new Fe;Fe.NAMES=Su;var Is=class extends It{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new kn,this.environmentIntensity=1,this.environmentRotation=new kn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},rn=new G,Rn=new G,ac=new G,Cn=new G,Fi=new G,Oi=new G,Rh=new G,cc=new G,lc=new G,hc=new G,uc=new ht,dc=new ht,fc=new ht,Yn=class i{constructor(e=new G,t=new G,n=new G){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),rn.subVectors(e,t),s.cross(rn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){rn.subVectors(s,t),Rn.subVectors(n,t),ac.subVectors(e,t);let o=rn.dot(rn),a=rn.dot(Rn),c=rn.dot(ac),l=Rn.dot(Rn),h=Rn.dot(ac),d=o*l-a*a;if(d===0)return r.set(0,0,0),null;let u=1/d,f=(l*c-a*h)*u,g=(o*h-a*c)*u;return r.set(1-f-g,g,f)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,Cn)===null?!1:Cn.x>=0&&Cn.y>=0&&Cn.x+Cn.y<=1}static getInterpolation(e,t,n,s,r,o,a,c){return this.getBarycoord(e,t,n,s,Cn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,Cn.x),c.addScaledVector(o,Cn.y),c.addScaledVector(a,Cn.z),c)}static getInterpolatedAttribute(e,t,n,s,r,o){return uc.setScalar(0),dc.setScalar(0),fc.setScalar(0),uc.fromBufferAttribute(e,t),dc.fromBufferAttribute(e,n),fc.fromBufferAttribute(e,s),o.setScalar(0),o.addScaledVector(uc,r.x),o.addScaledVector(dc,r.y),o.addScaledVector(fc,r.z),o}static isFrontFacing(e,t,n,s){return rn.subVectors(n,t),Rn.subVectors(e,t),rn.cross(Rn).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return rn.subVectors(this.c,this.b),Rn.subVectors(this.a,this.b),rn.cross(Rn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,o,a;Fi.subVectors(s,n),Oi.subVectors(r,n),cc.subVectors(e,n);let c=Fi.dot(cc),l=Oi.dot(cc);if(c<=0&&l<=0)return t.copy(n);lc.subVectors(e,s);let h=Fi.dot(lc),d=Oi.dot(lc);if(h>=0&&d<=h)return t.copy(s);let u=c*d-h*l;if(u<=0&&c>=0&&h<=0)return o=c/(c-h),t.copy(n).addScaledVector(Fi,o);hc.subVectors(e,r);let f=Fi.dot(hc),g=Oi.dot(hc);if(g>=0&&f<=g)return t.copy(r);let b=f*l-c*g;if(b<=0&&l>=0&&g<=0)return a=l/(l-g),t.copy(n).addScaledVector(Oi,a);let m=h*g-f*d;if(m<=0&&d-h>=0&&f-g>=0)return Rh.subVectors(r,s),a=(d-h)/(d-h+(f-g)),t.copy(s).addScaledVector(Rh,a);let p=1/(m+b+u);return o=b*p,a=u*p,t.copy(n).addScaledVector(Fi,o).addScaledVector(Oi,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Jn=class{constructor(e=new G(1/0,1/0,1/0),t=new G(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(on.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(on.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=on.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,on):on.fromBufferAttribute(r,o),on.applyMatrix4(e.matrixWorld),this.expandByPoint(on);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Pr.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Pr.copy(n.boundingBox)),Pr.applyMatrix4(e.matrixWorld),this.union(Pr)}let s=e.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,on),on.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ss),Ir.subVectors(this.max,Ss),Bi.subVectors(e.a,Ss),zi.subVectors(e.b,Ss),Vi.subVectors(e.c,Ss),$n.subVectors(zi,Bi),jn.subVectors(Vi,zi),mi.subVectors(Bi,Vi);let t=[0,-$n.z,$n.y,0,-jn.z,jn.y,0,-mi.z,mi.y,$n.z,0,-$n.x,jn.z,0,-jn.x,mi.z,0,-mi.x,-$n.y,$n.x,0,-jn.y,jn.x,0,-mi.y,mi.x,0];return!pc(t,Bi,zi,Vi,Ir)||(t=[1,0,0,0,1,0,0,0,1],!pc(t,Bi,zi,Vi,Ir))?!1:(Lr.crossVectors($n,jn),t=[Lr.x,Lr.y,Lr.z],pc(t,Bi,zi,Vi,Ir))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,on).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(on).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Pn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Pn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Pn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Pn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Pn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Pn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Pn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Pn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Pn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Pn=[new G,new G,new G,new G,new G,new G,new G,new G],on=new G,Pr=new Jn,Bi=new G,zi=new G,Vi=new G,$n=new G,jn=new G,mi=new G,Ss=new G,Ir=new G,Lr=new G,gi=new G;function pc(i,e,t,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){gi.fromArray(i,r);let a=s.x*Math.abs(gi.x)+s.y*Math.abs(gi.y)+s.z*Math.abs(gi.z),c=e.dot(gi),l=t.dot(gi),h=n.dot(gi);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>a)return!1}return!0}var mt=new G,kr=new We,Jf=0,Ft=class extends bn{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Jf++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=_u,this.updateRanges=[],this.gpuType=un,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)kr.fromBufferAttribute(this,t),kr.applyMatrix3(e),this.setXY(t,kr.x,kr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)mt.fromBufferAttribute(this,t),mt.applyMatrix3(e),this.setXYZ(t,mt.x,mt.y,mt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)mt.fromBufferAttribute(this,t),mt.applyMatrix4(e),this.setXYZ(t,mt.x,mt.y,mt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)mt.fromBufferAttribute(this,t),mt.applyNormalMatrix(e),this.setXYZ(t,mt.x,mt.y,mt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)mt.fromBufferAttribute(this,t),mt.transformDirection(e),this.setXYZ(t,mt.x,mt.y,mt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=bs(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Vt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=bs(t,this.array)),t}setX(e,t){return this.normalized&&(t=Vt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=bs(t,this.array)),t}setY(e,t){return this.normalized&&(t=Vt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=bs(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Vt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=bs(t,this.array)),t}setW(e,t){return this.normalized&&(t=Vt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Vt(t,this.array),n=Vt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=Vt(t,this.array),n=Vt(n,this.array),s=Vt(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=Vt(t,this.array),n=Vt(n,this.array),s=Vt(s,this.array),r=Vt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}};var Ls=class extends Ft{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var ks=class extends Ft{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var vt=class extends Ft{constructor(e,t,n){super(new Float32Array(e),t,n)}},Kf=new Jn,Ms=new G,mc=new G,Zi=class{constructor(e=new G,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):Kf.setFromPoints(e).getCenter(n);let s=0;for(let r=0,o=e.length;r<o;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Ms.subVectors(e,this.center);let t=Ms.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(Ms,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(mc.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Ms.copy(e.center).add(mc)),this.expandByPoint(Ms.copy(e.center).sub(mc))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Zf=0,Qt=new ct,gc=new It,Gi=new G,qt=new Jn,ws=new Jn,bt=new G,Wt=class i extends bn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Zf++}),this.uuid=er(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Ff(e)?ks:Ls)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Le().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Qt.makeRotationFromQuaternion(e),this.applyMatrix4(Qt),this}rotateX(e){return Qt.makeRotationX(e),this.applyMatrix4(Qt),this}rotateY(e){return Qt.makeRotationY(e),this.applyMatrix4(Qt),this}rotateZ(e){return Qt.makeRotationZ(e),this.applyMatrix4(Qt),this}translate(e,t,n){return Qt.makeTranslation(e,t,n),this.applyMatrix4(Qt),this}scale(e,t,n){return Qt.makeScale(e,t,n),this.applyMatrix4(Qt),this}lookAt(e){return gc.lookAt(e),gc.updateMatrix(),this.applyMatrix4(gc.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Gi).negate(),this.translate(Gi.x,Gi.y,Gi.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let s=0,r=e.length;s<r;s++){let o=e[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new vt(n,3))}else{let n=Math.min(e.length,t.count);for(let s=0;s<n;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&Ce("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Jn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Pe("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new G(-1/0,-1/0,-1/0),new G(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];qt.setFromBufferAttribute(r),this.morphTargetsRelative?(bt.addVectors(this.boundingBox.min,qt.min),this.boundingBox.expandByPoint(bt),bt.addVectors(this.boundingBox.max,qt.max),this.boundingBox.expandByPoint(bt)):(this.boundingBox.expandByPoint(qt.min),this.boundingBox.expandByPoint(qt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Pe('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Zi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Pe("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new G,1/0);return}if(e){let n=this.boundingSphere.center;if(qt.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];ws.setFromBufferAttribute(a),this.morphTargetsRelative?(bt.addVectors(qt.min,ws.min),qt.expandByPoint(bt),bt.addVectors(qt.max,ws.max),qt.expandByPoint(bt)):(qt.expandByPoint(ws.min),qt.expandByPoint(ws.max))}qt.getCenter(n);let s=0;for(let r=0,o=e.count;r<o;r++)bt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(bt));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],c=this.morphTargetsRelative;for(let l=0,h=a.count;l<h;l++)bt.fromBufferAttribute(a,l),c&&(Gi.fromBufferAttribute(e,l),bt.add(Gi)),s=Math.max(s,n.distanceToSquared(bt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Pe('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Pe("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,s=t.normal,r=t.uv,o=this.getAttribute("tangent");(o===void 0||o.count!==n.count)&&(o=new Ft(new Float32Array(4*n.count),4),this.setAttribute("tangent",o));let a=[],c=[];for(let y=0;y<n.count;y++)a[y]=new G,c[y]=new G;let l=new G,h=new G,d=new G,u=new We,f=new We,g=new We,b=new G,m=new G;function p(y,T,P){l.fromBufferAttribute(n,y),h.fromBufferAttribute(n,T),d.fromBufferAttribute(n,P),u.fromBufferAttribute(r,y),f.fromBufferAttribute(r,T),g.fromBufferAttribute(r,P),h.sub(l),d.sub(l),f.sub(u),g.sub(u);let I=1/(f.x*g.y-g.x*f.y);isFinite(I)&&(b.copy(h).multiplyScalar(g.y).addScaledVector(d,-f.y).multiplyScalar(I),m.copy(d).multiplyScalar(f.x).addScaledVector(h,-g.x).multiplyScalar(I),a[y].add(b),a[T].add(b),a[P].add(b),c[y].add(m),c[T].add(m),c[P].add(m))}let x=this.groups;x.length===0&&(x=[{start:0,count:e.count}]);for(let y=0,T=x.length;y<T;++y){let P=x[y],I=P.start,k=P.count;for(let L=I,C=I+k;L<C;L+=3)p(e.getX(L+0),e.getX(L+1),e.getX(L+2))}let R=new G,S=new G,M=new G,w=new G;function E(y){M.fromBufferAttribute(s,y),w.copy(M);let T=a[y];R.copy(T),R.sub(M.multiplyScalar(M.dot(T))).normalize(),S.crossVectors(w,T);let I=S.dot(c[y])<0?-1:1;o.setXYZW(y,R.x,R.y,R.z,I)}for(let y=0,T=x.length;y<T;++y){let P=x[y],I=P.start,k=P.count;for(let L=I,C=I+k;L<C;L+=3)E(e.getX(L+0)),E(e.getX(L+1)),E(e.getX(L+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new Ft(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let u=0,f=n.count;u<f;u++)n.setXYZ(u,0,0,0);let s=new G,r=new G,o=new G,a=new G,c=new G,l=new G,h=new G,d=new G;if(e)for(let u=0,f=e.count;u<f;u+=3){let g=e.getX(u+0),b=e.getX(u+1),m=e.getX(u+2);s.fromBufferAttribute(t,g),r.fromBufferAttribute(t,b),o.fromBufferAttribute(t,m),h.subVectors(o,r),d.subVectors(s,r),h.cross(d),a.fromBufferAttribute(n,g),c.fromBufferAttribute(n,b),l.fromBufferAttribute(n,m),a.add(h),c.add(h),l.add(h),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(b,c.x,c.y,c.z),n.setXYZ(m,l.x,l.y,l.z)}else for(let u=0,f=t.count;u<f;u+=3)s.fromBufferAttribute(t,u+0),r.fromBufferAttribute(t,u+1),o.fromBufferAttribute(t,u+2),h.subVectors(o,r),d.subVectors(s,r),h.cross(d),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)bt.fromBufferAttribute(e,t),bt.normalize(),e.setXYZ(t,bt.x,bt.y,bt.z)}toNonIndexed(){function e(a,c){let l=a.array,h=a.itemSize,d=a.normalized,u=new l.constructor(c.length*h),f=0,g=0;for(let b=0,m=c.length;b<m;b++){a.isInterleavedBufferAttribute?f=c[b]*a.data.stride+a.offset:f=c[b]*h;for(let p=0;p<h;p++)u[g++]=l[f++]}return new Ft(u,h,d)}if(this.index===null)return Ce("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let a in s){let c=s[a],l=e(c,n);t.setAttribute(a,l)}let r=this.morphAttributes;for(let a in r){let c=[],l=r[a];for(let h=0,d=l.length;h<d;h++){let u=l[h],f=e(u,n);c.push(f)}t.morphAttributes[a]=c}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,c=o.length;a<c;a++){let l=o[a];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let c=this.parameters;for(let l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let c in n){let l=n[c];e.data.attributes[c]=l.toJSON(e.data)}let s={},r=!1;for(let c in this.morphAttributes){let l=this.morphAttributes[c],h=[];for(let d=0,u=l.length;d<u;d++){let f=l[d];h.push(f.toJSON(e.data))}h.length>0&&(s[c]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let s=e.attributes;for(let l in s){let h=s[l];this.setAttribute(l,h.clone(t))}let r=e.morphAttributes;for(let l in r){let h=[],d=r[l];for(let u=0,f=d.length;u<f;u++)h.push(d[u].clone(t));this.morphAttributes[l]=h}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let l=0,h=o.length;l<h;l++){let d=o[l];this.addGroup(d.start,d.count,d.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var _c=new G,Qf=new G,ep=new Le,an=class{constructor(e=new G(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=_c.subVectors(n,t).cross(Qf.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let s=e.delta(_c),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let o=-(e.start.dot(this.normal)+this.constant)/r;return n===!0&&(o<0||o>1)?null:t.copy(e.start).addScaledVector(s,o)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||ep.getNormalMatrix(e),s=this.coplanarPoint(_c).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},tp=0,Kn=class extends bn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:tp++}),this.uuid=er(),this.name="",this.type="Material",this.blending=ns,this.side=Sn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=kc,this.blendDst=Dc,this.blendEquation=vi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Fe(0,0,0),this.blendAlpha=0,this.depthFunc=ji,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=hu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=jr,this.stencilZFail=jr,this.stencilZPass=jr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){Ce(`Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){Ce(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let o=[];for(let a in r){let c=r[a];delete c.metadata,o.push(c)}return o}if(t){let r=s(e.textures),o=s(e.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Fe().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(n=>new an().fromJSON(n))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let n=e.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new We().fromArray(n)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new We().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var In=new G,yc=new G,Dr=new G,Nr=new G,co=class{constructor(e=new G,t=new G(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,In)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=In.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(In.copy(this.origin).addScaledVector(this.direction,t),In.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){yc.copy(e).add(t).multiplyScalar(.5),Dr.copy(t).sub(e).normalize(),Nr.copy(this.origin).sub(yc);let r=e.distanceTo(t)*.5,o=-this.direction.dot(Dr),a=Nr.dot(this.direction),c=-Nr.dot(Dr),l=Nr.lengthSq(),h=Math.abs(1-o*o),d,u,f,g;if(h>0)if(d=o*c-a,u=o*a-c,g=r*h,d>=0)if(u>=-g)if(u<=g){let b=1/h;d*=b,u*=b,f=d*(d+o*u+2*a)+u*(o*d+u+2*c)+l}else u=r,d=Math.max(0,-(o*u+a)),f=-d*d+u*(u+2*c)+l;else u=-r,d=Math.max(0,-(o*u+a)),f=-d*d+u*(u+2*c)+l;else u<=-g?(d=Math.max(0,-(-o*r+a)),u=d>0?-r:Math.min(Math.max(-r,-c),r),f=-d*d+u*(u+2*c)+l):u<=g?(d=0,u=Math.min(Math.max(-r,-c),r),f=u*(u+2*c)+l):(d=Math.max(0,-(o*r+a)),u=d>0?r:Math.min(Math.max(-r,-c),r),f=-d*d+u*(u+2*c)+l);else u=o>0?-r:r,d=Math.max(0,-(o*u+a)),f=-d*d+u*(u+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(yc).addScaledVector(Dr,u),f}intersectSphere(e,t){if(e.radius<0)return null;In.subVectors(e.center,this.origin);let n=In.dot(this.direction),s=In.dot(In)-n*n,r=e.radius*e.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=n-o,c=n+o;return c<0?null:a<0?this.at(c,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,o,a,c,l=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return l>=0?(n=(e.min.x-u.x)*l,s=(e.max.x-u.x)*l):(n=(e.max.x-u.x)*l,s=(e.min.x-u.x)*l),h>=0?(r=(e.min.y-u.y)*h,o=(e.max.y-u.y)*h):(r=(e.max.y-u.y)*h,o=(e.min.y-u.y)*h),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),d>=0?(a=(e.min.z-u.z)*d,c=(e.max.z-u.z)*d):(a=(e.max.z-u.z)*d,c=(e.min.z-u.z)*d),n>c||a>s)||((a>n||n!==n)&&(n=a),(c<s||s!==s)&&(s=c),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,In)!==null}intersectTriangle(e,t,n,s,r){let o=this.origin,a=this.direction,c=a.x,l=a.y,h=a.z,d=e.x-o.x,u=e.y-o.y,f=e.z-o.z,g=t.x-o.x,b=t.y-o.y,m=t.z-o.z,p=n.x-o.x,x=n.y-o.y,R=n.z-o.z,S=Math.abs(c),M=Math.abs(l),w=Math.abs(h),E,y,T,P,I,k,L,C,F,H,V,q;if(S>=M&&S>=w?(T=c,k=d,F=g,q=p,c>=0?(E=l,y=h,P=u,I=f,L=b,C=m,H=x,V=R):(E=h,y=l,P=f,I=u,L=m,C=b,H=R,V=x)):M>=w?(T=l,k=u,F=b,q=x,l>=0?(E=h,y=c,P=f,I=d,L=m,C=g,H=R,V=p):(E=c,y=h,P=d,I=f,L=g,C=m,H=p,V=R)):(T=h,k=f,F=m,q=R,h>=0?(E=c,y=l,P=d,I=u,L=g,C=b,H=p,V=x):(E=l,y=c,P=u,I=d,L=b,C=g,H=x,V=p)),T===0)return null;let X=E/T,K=y/T,Z=1/T,be=P-X*k,ve=I-K*k,nt=L-X*F,$e=C-K*F,Ye=H-X*q,Y=V-K*q,te=Ye*$e-Y*nt,_e=be*Y-ve*Ye,ke=nt*ve-$e*be;if(s){if(te<0||_e<0||ke<0)return null}else if((te<0||_e<0||ke<0)&&(te>0||_e>0||ke>0))return null;let me=te+_e+ke;if(me===0)return null;let Be=Z*(te*k+_e*F+ke*q);return(me>0?Be<0:Be>0)?null:this.at(Be/me,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ds=class extends Kn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Fe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new kn,this.combine=Nc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Ch=new ct,_i=new co,Ur=new Zi,Ph=new G,Fr=new G,Or=new G,Br=new G,xc=new G,zr=new G,Ih=new G,Vr=new G,Xt=class extends It{constructor(e=new Wt,t=new Ds){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let a=this.morphTargetInfluences;if(r&&a){zr.set(0,0,0);for(let c=0,l=r.length;c<l;c++){let h=a[c],d=r[c];h!==0&&(xc.fromBufferAttribute(d,e),o?zr.addScaledVector(xc,h):zr.addScaledVector(xc.sub(t),h))}t.add(zr)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Ur.copy(n.boundingSphere),Ur.applyMatrix4(r),_i.copy(e.ray).recast(e.near),!(Ur.containsPoint(_i.origin)===!1&&(_i.intersectSphere(Ur,Ph)===null||_i.origin.distanceToSquared(Ph)>(e.far-e.near)**2))&&(Ch.copy(r).invert(),_i.copy(e.ray).applyMatrix4(Ch),!(n.boundingBox!==null&&_i.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,_i)))}_computeIntersections(e,t,n){let s,r=this.geometry,o=this.material,a=r.index,c=r.attributes.position,l=r.attributes.uv,h=r.attributes.uv1,d=r.attributes.normal,u=r.groups,f=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,b=u.length;g<b;g++){let m=u[g],p=o[m.materialIndex],x=Math.max(m.start,f.start),R=Math.min(a.count,Math.min(m.start+m.count,f.start+f.count));for(let S=x,M=R;S<M;S+=3){let w=a.getX(S),E=a.getX(S+1),y=a.getX(S+2);s=Gr(this,p,e,n,l,h,d,w,E,y),s&&(s.faceIndex=Math.floor(S/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let g=Math.max(0,f.start),b=Math.min(a.count,f.start+f.count);for(let m=g,p=b;m<p;m+=3){let x=a.getX(m),R=a.getX(m+1),S=a.getX(m+2);s=Gr(this,o,e,n,l,h,d,x,R,S),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}else if(c!==void 0)if(Array.isArray(o))for(let g=0,b=u.length;g<b;g++){let m=u[g],p=o[m.materialIndex],x=Math.max(m.start,f.start),R=Math.min(c.count,Math.min(m.start+m.count,f.start+f.count));for(let S=x,M=R;S<M;S+=3){let w=S,E=S+1,y=S+2;s=Gr(this,p,e,n,l,h,d,w,E,y),s&&(s.faceIndex=Math.floor(S/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let g=Math.max(0,f.start),b=Math.min(c.count,f.start+f.count);for(let m=g,p=b;m<p;m+=3){let x=m,R=m+1,S=m+2;s=Gr(this,o,e,n,l,h,d,x,R,S),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}}};function np(i,e,t,n,s,r,o,a){let c;if(e.side===Ot?c=n.intersectTriangle(o,r,s,!0,a):c=n.intersectTriangle(s,r,o,e.side===Sn,a),c===null)return null;Vr.copy(a),Vr.applyMatrix4(i.matrixWorld);let l=t.ray.origin.distanceTo(Vr);return l<t.near||l>t.far?null:{distance:l,point:Vr.clone(),object:i}}function Gr(i,e,t,n,s,r,o,a,c,l){i.getVertexPosition(a,Fr),i.getVertexPosition(c,Or),i.getVertexPosition(l,Br);let h=np(i,e,t,n,Fr,Or,Br,Ih);if(h){let d=new G;Yn.getBarycoord(Ih,Fr,Or,Br,d),s&&(h.uv=Yn.getInterpolatedAttribute(s,a,c,l,d,new We)),r&&(h.uv1=Yn.getInterpolatedAttribute(r,a,c,l,d,new We)),o&&(h.normal=Yn.getInterpolatedAttribute(o,a,c,l,d,new G),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let u={a,b:c,c:l,normal:new G,materialIndex:0};Yn.getNormal(Fr,Or,Br,u.normal),h.face=u,h.barycoord=d}return h}var lo=class extends Gt{constructor(e=null,t=1,n=1,s,r,o,a,c,l=St,h=St,d,u){super(null,o,a,c,l,h,s,r,d,u),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var yi=new Zi,ip=new We(.5,.5),Hr=new G,Qi=class{constructor(e=new an,t=new an,n=new an,s=new an,r=new an,o=new an){this.planes=[e,t,n,s,r,o]}set(e,t,n,s,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=cn,n=!1){let s=this.planes,r=e.elements,o=r[0],a=r[1],c=r[2],l=r[3],h=r[4],d=r[5],u=r[6],f=r[7],g=r[8],b=r[9],m=r[10],p=r[11],x=r[12],R=r[13],S=r[14],M=r[15];if(s[0].setComponents(l-o,f-h,p-g,M-x).normalize(),s[1].setComponents(l+o,f+h,p+g,M+x).normalize(),s[2].setComponents(l+a,f+d,p+b,M+R).normalize(),s[3].setComponents(l-a,f-d,p-b,M-R).normalize(),n)s[4].setComponents(c,u,m,S).normalize(),s[5].setComponents(l-c,f-u,p-m,M-S).normalize();else if(s[4].setComponents(l-c,f-u,p-m,M-S).normalize(),t===cn)s[5].setComponents(l+c,f+u,p+m,M+S).normalize();else if(t===qi)s[5].setComponents(c,u,m,S).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),yi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),yi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(yi)}intersectsSprite(e){yi.center.set(0,0,0);let t=ip.distanceTo(e.center);return yi.radius=.7071067811865476+t,yi.applyMatrix4(e.matrixWorld),this.intersectsSphere(yi)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(Hr.x=s.normal.x>0?e.max.x:e.min.x,Hr.y=s.normal.y>0?e.max.y:e.min.y,Hr.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Hr)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Ns=class extends Gt{constructor(e=[],t=ii,n,s,r,o,a,c,l,h){super(e,t,n,s,r,o,a,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}};var Zn=class extends Gt{constructor(e,t,n=hn,s,r,o,a=St,c=St,l,h=xn,d=1){if(h!==xn&&h!==ri)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let u={width:e,height:t,depth:d};super(u,s,r,o,a,c,h,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Ji(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},ho=class extends Zn{constructor(e,t=hn,n=ii,s,r,o=St,a=St,c,l=xn){let h={width:e,height:e,depth:1},d=[h,h,h,h,h,h];super(e,e,t,n,s,r,o,a,c,l),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},Us=class extends Gt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},Qn=class i extends Wt{constructor(e=1,t=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let c=[],l=[],h=[],d=[],u=0,f=0;g("z","y","x",-1,-1,n,t,e,o,r,0),g("z","y","x",1,-1,n,t,-e,o,r,1),g("x","z","y",1,1,e,n,t,s,o,2),g("x","z","y",1,-1,e,n,-t,s,o,3),g("x","y","z",1,-1,e,t,n,s,r,4),g("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(c),this.setAttribute("position",new vt(l,3)),this.setAttribute("normal",new vt(h,3)),this.setAttribute("uv",new vt(d,2));function g(b,m,p,x,R,S,M,w,E,y,T){let P=S/E,I=M/y,k=S/2,L=M/2,C=w/2,F=E+1,H=y+1,V=0,q=0,X=new G;for(let K=0;K<H;K++){let Z=K*I-L;for(let be=0;be<F;be++){let ve=be*P-k;X[b]=ve*x,X[m]=Z*R,X[p]=C,l.push(X.x,X.y,X.z),X[b]=0,X[m]=0,X[p]=w>0?1:-1,h.push(X.x,X.y,X.z),d.push(be/E),d.push(1-K/y),V+=1}}for(let K=0;K<y;K++)for(let Z=0;Z<E;Z++){let be=u+Z+F*K,ve=u+Z+F*(K+1),nt=u+(Z+1)+F*(K+1),$e=u+(Z+1)+F*K;c.push(be,ve,$e),c.push(ve,nt,$e),q+=6}a.addGroup(f,q,T),f+=q,u+=V}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var Fs=class i extends Wt{constructor(e=1,t=1,n=1,s=32,r=1,o=!1,a=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:c};let l=this;s=Math.floor(s),r=Math.floor(r);let h=[],d=[],u=[],f=[],g=0,b=[],m=n/2,p=0;x(),o===!1&&(e>0&&R(!0),t>0&&R(!1)),this.setIndex(h),this.setAttribute("position",new vt(d,3)),this.setAttribute("normal",new vt(u,3)),this.setAttribute("uv",new vt(f,2));function x(){let S=new G,M=new G,w=0,E=(t-e)/n;for(let y=0;y<=r;y++){let T=[],P=y/r,I=P*(t-e)+e;for(let k=0;k<=s;k++){let L=k/s,C=L*c+a,F=Math.sin(C),H=Math.cos(C);M.x=I*F,M.y=-P*n+m,M.z=I*H,d.push(M.x,M.y,M.z),S.set(F,E,H).normalize(),u.push(S.x,S.y,S.z),f.push(L,1-P),T.push(g++)}b.push(T)}for(let y=0;y<s;y++)for(let T=0;T<r;T++){let P=b[T][y],I=b[T+1][y],k=b[T+1][y+1],L=b[T][y+1];(e>0||T!==0)&&(h.push(P,I,L),w+=3),(t>0||T!==r-1)&&(h.push(I,k,L),w+=3)}l.addGroup(p,w,0),p+=w}function R(S){let M=g,w=new We,E=new G,y=0,T=S===!0?e:t,P=S===!0?1:-1;for(let k=1;k<=s;k++)d.push(0,m*P,0),u.push(0,P,0),f.push(.5,.5),g++;let I=g;for(let k=0;k<=s;k++){let C=k/s*c+a,F=Math.cos(C),H=Math.sin(C);E.x=T*H,E.y=m*P,E.z=T*F,d.push(E.x,E.y,E.z),u.push(0,P,0),w.x=F*.5+.5,w.y=H*.5*P+.5,f.push(w.x,w.y),g++}for(let k=0;k<s;k++){let L=M+k,C=I+k;S===!0?h.push(C,C+1,L):h.push(C+1,C,L),y+=3}l.addGroup(p,y,S===!0?1:2),p+=y}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var bi=class i extends Wt{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,o=t/2,a=Math.floor(n),c=Math.floor(s),l=a+1,h=c+1,d=e/a,u=t/c,f=[],g=[],b=[],m=[];for(let p=0;p<h;p++){let x=p*u-o;for(let R=0;R<l;R++){let S=R*d-r;g.push(S,-x,0),b.push(0,0,1),m.push(R/a),m.push(1-p/c)}}for(let p=0;p<c;p++)for(let x=0;x<a;x++){let R=x+l*p,S=x+l*(p+1),M=x+1+l*(p+1),w=x+1+l*p;f.push(R,S,w),f.push(S,M,w)}this.setIndex(f),this.setAttribute("position",new vt(g,3)),this.setAttribute("normal",new vt(b,3)),this.setAttribute("uv",new vt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}};var Os=class i extends Wt{constructor(e=1,t=32,n=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let c=Math.min(o+a,Math.PI),l=0,h=[],d=new G,u=new G,f=[],g=[],b=[],m=[];for(let p=0;p<=n;p++){let x=[],R=p/n,S=o+R*a,M=e*Math.cos(S),w=Math.sqrt(e*e-M*M),E=0;p===0&&o===0?E=.5/t:p===n&&c===Math.PI&&(E=-.5/t);for(let y=0;y<=t;y++){let T=y/t,P=s+T*r;d.x=-w*Math.cos(P),d.y=M,d.z=w*Math.sin(P),g.push(d.x,d.y,d.z),u.copy(d).normalize(),b.push(u.x,u.y,u.z),m.push(T+E,1-R),x.push(l++)}h.push(x)}for(let p=0;p<n;p++)for(let x=0;x<t;x++){let R=h[p][x+1],S=h[p][x],M=h[p+1][x],w=h[p+1][x+1];(p!==0||o>0)&&f.push(R,S,w),(p!==n-1||c<Math.PI)&&f.push(S,M,w)}this.setIndex(f),this.setAttribute("position",new vt(g,3)),this.setAttribute("normal",new vt(b,3)),this.setAttribute("uv",new vt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};function Mi(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];if(Lh(s))s.isRenderTargetTexture?(Ce("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone();else if(Array.isArray(s))if(Lh(s[0])){let r=[];for(let o=0,a=s.length;o<a;o++)r[o]=s[o].clone();e[t][n]=r}else e[t][n]=s.slice();else e[t][n]=s}}return e}function Lt(i){let e={};for(let t=0;t<i.length;t++){let n=Mi(i[t]);for(let s in n)e[s]=n[s]}return e}function Lh(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function sp(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function Qc(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:He.workingColorSpace}var Mu={clone:Mi,merge:Lt},rp=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,op=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Yt=class extends Kn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=rp,this.fragmentShader=op,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Mi(e.uniforms),this.uniformsGroups=sp(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let s=e.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=t[s.value]||null;break;case"c":this.uniforms[n].value=new Fe().setHex(s.value);break;case"v2":this.uniforms[n].value=new We().fromArray(s.value);break;case"v3":this.uniforms[n].value=new G().fromArray(s.value);break;case"v4":this.uniforms[n].value=new ht().fromArray(s.value);break;case"m3":this.uniforms[n].value=new Le().fromArray(s.value);break;case"m4":this.uniforms[n].value=new ct().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let n in e.extensions)this.extensions[n]=e.extensions[n];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},uo=class extends Yt{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}},Bs=class extends Kn{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Fe(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Fe(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=fa,this.normalScale=new We(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new kn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var fo=class extends Kn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=cu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},po=class extends Kn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Hi(i,e){return!i||i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function bc(i){return i!==void 0&&i.inTangents!==void 0&&i.outTangents!==void 0}var ei=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];n:{e:{let o;t:{i:if(!(e<s)){for(let a=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=s,s=t[++n],e<s)break e}o=t.length;break t}if(!(e>=r)){let a=t[1];e<a&&(n=2,r=a);for(let c=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===c)break;if(s=r,r=t[--n-1],e>=r)break e}o=n,n=0;break t}break n}for(;n<o;){let a=n+o>>>1;e<t[a]?o=a:n=a+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let o=0;o!==s;++o)t[o]=n[r+o];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},mo=class extends ei{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Mc,endingEnd:Mc}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,o=e+1,a=s[r],c=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case wc:r=e,a=2*t-n;break;case Tc:r=s.length-2,a=t+s[r]-s[r+1];break;default:r=e,a=n}if(c===void 0)switch(this.getSettings_().endingEnd){case wc:o=e,c=2*n-t;break;case Tc:o=1,c=n+s[1]-s[0];break;default:o=e-1,c=t}let l=(n-t)*.5,h=this.valueSize;this._weightPrev=l/(t-a),this._weightNext=l/(c-n),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,h=this._offsetPrev,d=this._offsetNext,u=this._weightPrev,f=this._weightNext,g=(n-t)/(s-t),b=g*g,m=b*g,p=-u*m+2*u*b-u*g,x=(1+u)*m+(-1.5-2*u)*b+(-.5+u)*g+1,R=(-1-f)*m+(1.5+f)*b+.5*g,S=f*m-f*b;for(let M=0;M!==a;++M)r[M]=p*o[h+M]+x*o[l+M]+R*o[c+M]+S*o[d+M];return r}},go=class extends ei{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,h=(n-t)/(s-t),d=1-h;for(let u=0;u!==a;++u)r[u]=o[l+u]*d+o[c+u]*h;return r}},_o=class extends ei{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},yo=class extends ei{interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,h=this.inTangents,d=this.outTangents;if(!h||!d){let g=(n-t)/(s-t),b=1-g;for(let m=0;m!==a;++m)r[m]=o[l+m]*b+o[c+m]*g;return r}let u=a*2,f=e-1;for(let g=0;g!==a;++g){let b=o[l+g],m=o[c+g],p=f*u+g*2,x=d[p],R=d[p+1],S=e*u+g*2,M=h[S],w=h[S+1],E=cp(n,t,x,M,s);r[g]=wu(E,b,R,w,m)}return r}};function wu(i,e,t,n,s){let r=1-i;return r*r*r*e+3*r*r*i*t+3*r*i*i*n+i*i*i*s}function ap(i,e,t,n,s){let r=1-i;return 3*r*r*(t-e)+6*r*i*(n-t)+3*i*i*(s-n)}function cp(i,e,t,n,s){let r=(i-e)/(s-e);for(let o=0;o<8;o++){let a=wu(r,e,t,n,s)-i;if(Math.abs(a)<1e-10)break;let c=ap(r,e,t,n,s);if(Math.abs(c)<1e-10)break;r=Math.max(0,Math.min(1,r-a/c))}return r}var Jt=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Hi(t,this.TimeBufferType),this.values=Hi(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Hi(e.times,Array),values:Hi(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s),bc(e.settings)&&(n.settings={inTangents:Hi(e.settings.inTangents,Array),outTangents:Hi(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new _o(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new go(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new mo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new yo(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Ts:t=this.InterpolantFactoryMethodDiscrete;break;case io:t=this.InterpolantFactoryMethodLinear;break;case $r:t=this.InterpolantFactoryMethodSmooth;break;case Sc:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Ce("KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ts;case this.InterpolantFactoryMethodLinear:return io;case this.InterpolantFactoryMethodSmooth:return $r;case this.InterpolantFactoryMethodBezier:return Sc}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e;bc(this.settings)&&(kh(this.settings.inTangents,e),kh(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,s=n.length,r=0,o=s-1;for(;r!==s&&n[r]<e;)++r;for(;o!==-1&&n[o]>t;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(Pe("KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(Pe("KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let c=n[a];if(typeof c=="number"&&isNaN(c)){Pe("KeyframeTrack: Time is not a valid number.",this,a,c),e=!1;break}if(o!==null&&o>c){Pe("KeyframeTrack: Out of order keys.",this,a,c,o),e=!1;break}o=c}if(s!==void 0&&Of(s))for(let a=0,c=s.length;a!==c;++a){let l=s[a];if(isNaN(l)){Pe("KeyframeTrack: Value is not a valid number.",this,a,l),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===$r,r=e.length-1,o=1;for(let a=1;a<r;++a){let c=!1,l=e[a],h=e[a+1];if(l!==h&&(a!==1||l!==e[0]))if(s)c=!0;else{let d=a*n,u=d-n,f=d+n;for(let g=0;g!==n;++g){let b=t[d+g];if(b!==t[u+g]||b!==t[f+g]){c=!0;break}}}if(c){if(a!==o){e[o]=e[a];let d=a*n,u=o*n;for(let f=0;f!==n;++f)t[u+f]=t[d+f]}++o}}if(r>0){e[o]=e[r];for(let a=r*n,c=o*n,l=0;l!==n;++l)t[c+l]=t[a+l];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,bc(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function kh(i,e){for(let t=0,n=i.length;t!==n;t+=2)i[t]*=e}Jt.prototype.ValueTypeName="";Jt.prototype.TimeBufferType=Float32Array;Jt.prototype.ValueBufferType=Float32Array;Jt.prototype.DefaultInterpolation=io;var ti=class extends Jt{constructor(e,t,n){super(e,t,n)}};ti.prototype.ValueTypeName="bool";ti.prototype.ValueBufferType=Array;ti.prototype.DefaultInterpolation=Ts;ti.prototype.InterpolantFactoryMethodLinear=void 0;ti.prototype.InterpolantFactoryMethodSmooth=void 0;var xo=class extends Jt{constructor(e,t,n,s){super(e,t,n,s)}};xo.prototype.ValueTypeName="color";var bo=class extends Jt{constructor(e,t,n,s){super(e,t,n,s)}};bo.prototype.ValueTypeName="number";var vo=class extends ei{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=(n-t)/(s-t),l=e*a;for(let h=l+a;l!==h;l+=4)vn.slerpFlat(r,0,o,l-a,o,l,c);return r}},zs=class extends Jt{constructor(e,t,n,s){super(e,t,n,s)}InterpolantFactoryMethodLinear(e){return new vo(this.times,this.values,this.getValueSize(),e)}};zs.prototype.ValueTypeName="quaternion";zs.prototype.InterpolantFactoryMethodSmooth=void 0;var ni=class extends Jt{constructor(e,t,n){super(e,t,n)}};ni.prototype.ValueTypeName="string";ni.prototype.ValueBufferType=Array;ni.prototype.DefaultInterpolation=Ts;ni.prototype.InterpolantFactoryMethodLinear=void 0;ni.prototype.InterpolantFactoryMethodSmooth=void 0;var So=class extends Jt{constructor(e,t,n,s){super(e,t,n,s)}};So.prototype.ValueTypeName="vector";var Mo=class{constructor(e,t,n){let s=this,r=!1,o=0,a=0,c,l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(h){a++,r===!1&&s.onStart!==void 0&&s.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,s.onProgress!==void 0&&s.onProgress(h,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),c?c(h):h},this.setURLModifier=function(h){return c=h,this},this.addHandler=function(h,d){return l.push(h,d),this},this.removeHandler=function(h){let d=l.indexOf(h);return d!==-1&&l.splice(d,2),this},this.getHandler=function(h){for(let d=0,u=l.length;d<u;d+=2){let f=l[d],g=l[d+1];if(f.global&&(f.lastIndex=0),f.test(h))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},Tu=new Mo,wo=class{constructor(e){this.manager=e!==void 0?e:Tu,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};wo.DEFAULT_MATERIAL_NAME="__DEFAULT";var Vs=class extends It{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Fe(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},Gs=class extends Vs{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(It.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Fe(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},vc=new ct,Dh=new G,Nh=new G,To=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new We(512,512),this.mapType=$t,this.map=null,this.mapPass=null,this.matrix=new ct,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Qi,this._frameExtents=new We(1,1),this._viewportCount=1,this._viewports=[new ht(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;Dh.setFromMatrixPosition(e.matrixWorld),t.position.copy(Dh),Nh.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Nh),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,s){vc.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(vc,e.coordinateSystem,e.reversedDepth);let r=this._frameExtents,o=s?s.z/r.x:1,a=s?s.w/r.y:1,c=s?s.x/r.x:0,l=s?s.y/r.y:0;e.coordinateSystem===qi||e.reversedDepth?t.set(.5*o,0,0,.5*o+c,0,.5*a,0,.5*a+l,0,0,1,0,0,0,0,1):t.set(.5*o,0,0,.5*o+c,0,.5*a,0,.5*a+l,0,0,.5,.5,0,0,0,1),t.multiply(vc)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},Wr=new G,Xr=new vn,gn=new G,Hs=class extends It{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ct,this.projectionMatrix=new ct,this.projectionMatrixInverse=new ct,this.coordinateSystem=cn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Wr,Xr,gn),gn.x===1&&gn.y===1&&gn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Wr,Xr,gn.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Wr,Xr,gn),gn.x===1&&gn.y===1&&gn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Wr,Xr,gn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},qn=new G,Uh=new We,Fh=new We,Pt=class extends Hs{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=so*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Qa*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return so*2*Math.atan(Math.tan(Qa*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){qn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(qn.x,qn.y).multiplyScalar(-e/qn.z),qn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(qn.x,qn.y).multiplyScalar(-e/qn.z)}getViewSize(e,t){return this.getViewBounds(e,Uh,Fh),t.subVectors(Fh,Uh)}setViewOffset(e,t,n,s,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Qa*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let c=o.fullWidth,l=o.fullHeight;r+=o.offsetX*s/c,t-=o.offsetY*n/l,s*=o.width/c,n*=o.height/l}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var es=class extends Hs{constructor(e=-1,t=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,o=n+e,a=s+t,c=s-t;if(this.view!==null&&this.view.enabled){let l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,o=r+l*this.view.width,a-=h*this.view.offsetY,c=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Ac=class extends To{constructor(){super(new es(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Ws=class extends Vs{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(It.DEFAULT_UP),this.updateMatrix(),this.target=new It,this.shadow=new Ac}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}};var Wi=-90,Xi=1,Ao=class extends It{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Pt(Wi,Xi,e,t);s.layers=this.layers,this.add(s);let r=new Pt(Wi,Xi,e,t);r.layers=this.layers,this.add(r);let o=new Pt(Wi,Xi,e,t);o.layers=this.layers,this.add(o);let a=new Pt(Wi,Xi,e,t);a.layers=this.layers,this.add(a);let c=new Pt(Wi,Xi,e,t);c.layers=this.layers,this.add(c);let l=new Pt(Wi,Xi,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,o,a,c]=t;for(let l of t)this.remove(l);if(e===cn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===qi)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,c,l,h]=this.children,d=e.getRenderTarget(),u=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let b=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let m=!1;e.isWebGLRenderer===!0?m=e.state.buffers.depth.getReversed():m=e.reversedDepthBuffer,e.setRenderTarget(n,0,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(n,1,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,2,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,3,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),e.setRenderTarget(n,4,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),n.texture.generateMipmaps=b,e.setRenderTarget(n,5,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(d,u,f),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},Eo=class extends Pt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var el="\\[\\]\\.:\\/",lp=new RegExp("["+el+"]","g"),tl="[^"+el+"]",hp="[^"+el.replace("\\.","")+"]",up=/((?:WC+[\/:])*)/.source.replace("WC",tl),dp=/(WCOD+)?/.source.replace("WCOD",hp),fp=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",tl),pp=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",tl),mp=new RegExp("^"+up+dp+fp+pp+"$"),gp=["material","materials","bones","map"],Ec=class{constructor(e,t,n){let s=n||at.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},at=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(lp,"")}static parseTrackName(e){let t=mp.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);gp.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let c=n(a.children);if(c)return c}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Ce("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let l=t.objectIndex;switch(n){case"materials":if(!e.material){Pe("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Pe("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Pe("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===l){l=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Pe("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Pe("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){Pe("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(l!==void 0){if(e[l]===void 0){Pe("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[l]}}let o=e[s];if(o===void 0){let l=t.nodeName;Pe("PropertyBinding: Trying to update property for track: "+l+"."+s+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){Pe("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Pe("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};at.Composite=Ec;at.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};at.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};at.prototype.GetterByBindingType=[at.prototype._getValue_direct,at.prototype._getValue_array,at.prototype._getValue_arrayElement,at.prototype._getValue_toArray];at.prototype.SetterByBindingTypeAndVersioning=[[at.prototype._setValue_direct,at.prototype._setValue_direct_setNeedsUpdate,at.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[at.prototype._setValue_array,at.prototype._setValue_array_setNeedsUpdate,at.prototype._setValue_array_setMatrixWorldNeedsUpdate],[at.prototype._setValue_arrayElement,at.prototype._setValue_arrayElement_setNeedsUpdate,at.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[at.prototype._setValue_fromArray,at.prototype._setValue_fromArray_setNeedsUpdate,at.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var lb=new Float32Array(1);var Rc=class i{static{i.prototype.isMatrix2=!0}constructor(e,t,n,s){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,s){let r=this.elements;return r[0]=e,r[2]=t,r[1]=n,r[3]=s,this}};function nl(i,e,t,n){let s=_p(n);switch(t){case qc:return i*e;case Jc:return i*e/s.components*s.byteLength;case Do:return i*e/s.components*s.byteLength;case oi:return i*e*2/s.components*s.byteLength;case No:return i*e*2/s.components*s.byteLength;case Yc:return i*e*3/s.components*s.byteLength;case tn:return i*e*4/s.components*s.byteLength;case Uo:return i*e*4/s.components*s.byteLength;case qs:case Ys:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Js:case Ks:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Oo:case zo:return Math.max(i,16)*Math.max(e,8)/4;case Fo:case Bo:return Math.max(i,8)*Math.max(e,8)/2;case Vo:case Go:case Wo:case Xo:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Ho:case Zs:case $o:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case jo:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case qo:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case Yo:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case Jo:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case Ko:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case Zo:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case Qo:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case ea:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case ta:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case na:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case ia:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case sa:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case ra:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case oa:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case aa:case ca:case la:return Math.ceil(i/4)*Math.ceil(e/4)*16;case ha:case ua:return Math.ceil(i/4)*Math.ceil(e/4)*8;case Qs:case da:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function _p(i){switch(i){case $t:case Wc:return{byteLength:1,components:1};case is:case Xc:case dn:return{byteLength:2,components:1};case Lo:case ko:return{byteLength:2,components:4};case hn:case Io:case un:return{byteLength:4,components:1};case $c:case jc:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?Ce("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function ju(){let i=null,e=!1,t=null,n=null;function s(r,o){n=i.requestAnimationFrame(s),t(r,o)}return{start:function(){e!==!0&&t!==null&&i!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function xp(i){let e=new WeakMap;function t(a,c){let l=a.array,h=a.usage,d=l.byteLength,u=i.createBuffer();i.bindBuffer(c,u),i.bufferData(c,l,h),a.onUploadCallback();let f;if(l instanceof Float32Array)f=i.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)f=i.HALF_FLOAT;else if(l instanceof Uint16Array)a.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)f=i.SHORT;else if(l instanceof Uint32Array)f=i.UNSIGNED_INT;else if(l instanceof Int32Array)f=i.INT;else if(l instanceof Int8Array)f=i.BYTE;else if(l instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:u,type:f,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:d}}function n(a,c,l){let h=c.array,d=c.updateRanges;if(i.bindBuffer(l,a),d.length===0)i.bufferSubData(l,0,h);else{d.sort((f,g)=>f.start-g.start);let u=0;for(let f=1;f<d.length;f++){let g=d[u],b=d[f];b.start<=g.start+g.count+1?g.count=Math.max(g.count,b.start+b.count-g.start):(++u,d[u]=b)}d.length=u+1;for(let f=0,g=d.length;f<g;f++){let b=d[f];i.bufferSubData(l,b.start*h.BYTES_PER_ELEMENT,h,b.start,b.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let c=e.get(a);c&&(i.deleteBuffer(c.buffer),e.delete(a))}function o(a,c){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=e.get(a);(!h||h.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let l=e.get(a);if(l===void 0)e.set(a,t(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,a,c),l.version=a.version}}return{get:s,remove:r,update:o}}var bp=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,vp=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Sp=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Mp=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,wp=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Tp=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Ap=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Ep=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Rp=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Cp=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Pp=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Ip=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Lp=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,kp=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Dp=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Np=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Up=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Fp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Op=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Bp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,zp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Vp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Gp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Hp=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Wp=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Xp=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,$p=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,jp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,qp=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Yp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Jp="gl_FragColor = linearToOutputTexel( gl_FragColor );",Kp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Zp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,Qp=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,em=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,tm=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,nm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,im=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,sm=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,rm=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,om=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,am=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,cm=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lm=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,hm=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,um=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,dm=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,fm=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,pm=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,mm=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,gm=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,_m=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,ym=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,xm=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,bm=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,vm=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Sm=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Mm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,wm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Tm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Am=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Em=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Rm=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Cm=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Pm=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Im=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Lm=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,km=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Dm=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Nm=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Um=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Fm=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Om=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Bm=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,zm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Vm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Gm=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Hm=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Wm=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Xm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,$m=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,jm=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,qm=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Ym=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Jm=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Km=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Zm=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Qm=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,eg=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,tg=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,ng=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,ig=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,sg=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,rg=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,og=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,ag=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,cg=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,lg=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,hg=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,ug=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,dg=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,fg=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,pg=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,mg=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,gg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,_g=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,yg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,xg=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,bg=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,vg=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Sg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Mg=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,wg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Tg=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ag=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Eg=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Rg=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Cg=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Pg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Ig=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Lg=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,kg=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Dg=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Ng=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ug=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Fg=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Og=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Bg=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,zg=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Vg=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Gg=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Hg=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Wg=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Xg=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,$g=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,jg=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,qg=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Yg=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Jg=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Kg=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Zg=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Qg=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Oe={alphahash_fragment:bp,alphahash_pars_fragment:vp,alphamap_fragment:Sp,alphamap_pars_fragment:Mp,alphatest_fragment:wp,alphatest_pars_fragment:Tp,aomap_fragment:Ap,aomap_pars_fragment:Ep,batching_pars_vertex:Rp,batching_vertex:Cp,begin_vertex:Pp,beginnormal_vertex:Ip,bsdfs:Lp,iridescence_fragment:kp,bumpmap_pars_fragment:Dp,clipping_planes_fragment:Np,clipping_planes_pars_fragment:Up,clipping_planes_pars_vertex:Fp,clipping_planes_vertex:Op,color_fragment:Bp,color_pars_fragment:zp,color_pars_vertex:Vp,color_vertex:Gp,common:Hp,cube_uv_reflection_fragment:Wp,defaultnormal_vertex:Xp,displacementmap_pars_vertex:$p,displacementmap_vertex:jp,emissivemap_fragment:qp,emissivemap_pars_fragment:Yp,colorspace_fragment:Jp,colorspace_pars_fragment:Kp,envmap_fragment:Zp,envmap_common_pars_fragment:Qp,envmap_pars_fragment:em,envmap_pars_vertex:tm,envmap_physical_pars_fragment:dm,envmap_vertex:nm,fog_vertex:im,fog_pars_vertex:sm,fog_fragment:rm,fog_pars_fragment:om,gradientmap_pars_fragment:am,lightmap_pars_fragment:cm,lights_lambert_fragment:lm,lights_lambert_pars_fragment:hm,lights_pars_begin:um,lights_toon_fragment:fm,lights_toon_pars_fragment:pm,lights_phong_fragment:mm,lights_phong_pars_fragment:gm,lights_physical_fragment:_m,lights_physical_pars_fragment:ym,lights_fragment_begin:xm,lights_fragment_maps:bm,lights_fragment_end:vm,lightprobes_pars_fragment:Sm,logdepthbuf_fragment:Mm,logdepthbuf_pars_fragment:wm,logdepthbuf_pars_vertex:Tm,logdepthbuf_vertex:Am,map_fragment:Em,map_pars_fragment:Rm,map_particle_fragment:Cm,map_particle_pars_fragment:Pm,metalnessmap_fragment:Im,metalnessmap_pars_fragment:Lm,morphinstance_vertex:km,morphcolor_vertex:Dm,morphnormal_vertex:Nm,morphtarget_pars_vertex:Um,morphtarget_vertex:Fm,normal_fragment_begin:Om,normal_fragment_maps:Bm,normal_pars_fragment:zm,normal_pars_vertex:Vm,normal_vertex:Gm,normalmap_pars_fragment:Hm,clearcoat_normal_fragment_begin:Wm,clearcoat_normal_fragment_maps:Xm,clearcoat_pars_fragment:$m,iridescence_pars_fragment:jm,opaque_fragment:qm,packing:Ym,premultiplied_alpha_fragment:Jm,project_vertex:Km,dithering_fragment:Zm,dithering_pars_fragment:Qm,roughnessmap_fragment:eg,roughnessmap_pars_fragment:tg,shadowmap_pars_fragment:ng,shadowmap_pars_vertex:ig,shadowmap_vertex:sg,shadowmask_pars_fragment:rg,skinbase_vertex:og,skinning_pars_vertex:ag,skinning_vertex:cg,skinnormal_vertex:lg,specularmap_fragment:hg,specularmap_pars_fragment:ug,tonemapping_fragment:dg,tonemapping_pars_fragment:fg,transmission_fragment:pg,transmission_pars_fragment:mg,uv_pars_fragment:gg,uv_pars_vertex:_g,uv_vertex:yg,worldpos_vertex:xg,background_vert:bg,background_frag:vg,backgroundCube_vert:Sg,backgroundCube_frag:Mg,cube_vert:wg,cube_frag:Tg,depth_vert:Ag,depth_frag:Eg,distance_vert:Rg,distance_frag:Cg,equirect_vert:Pg,equirect_frag:Ig,linedashed_vert:Lg,linedashed_frag:kg,meshbasic_vert:Dg,meshbasic_frag:Ng,meshlambert_vert:Ug,meshlambert_frag:Fg,meshmatcap_vert:Og,meshmatcap_frag:Bg,meshnormal_vert:zg,meshnormal_frag:Vg,meshphong_vert:Gg,meshphong_frag:Hg,meshphysical_vert:Wg,meshphysical_frag:Xg,meshtoon_vert:$g,meshtoon_frag:jg,points_vert:qg,points_frag:Yg,shadow_vert:Jg,shadow_frag:Kg,sprite_vert:Zg,sprite_frag:Qg},he={common:{diffuse:{value:new Fe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Le},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Le}},envmap:{envMap:{value:null},envMapRotation:{value:new Le},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Le}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Le}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Le},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Le},normalScale:{value:new We(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Le},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Le}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Le}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Le}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Fe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new G},probesMax:{value:new G},probesResolution:{value:new G}},points:{diffuse:{value:new Fe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0},uvTransform:{value:new Le}},sprite:{diffuse:{value:new Fe(16777215)},opacity:{value:1},center:{value:new We(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Le},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0}}},Tn={basic:{uniforms:Lt([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.fog]),vertexShader:Oe.meshbasic_vert,fragmentShader:Oe.meshbasic_frag},lambert:{uniforms:Lt([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.fog,he.lights,{emissive:{value:new Fe(0)},envMapIntensity:{value:1}}]),vertexShader:Oe.meshlambert_vert,fragmentShader:Oe.meshlambert_frag},phong:{uniforms:Lt([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.fog,he.lights,{emissive:{value:new Fe(0)},specular:{value:new Fe(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Oe.meshphong_vert,fragmentShader:Oe.meshphong_frag},standard:{uniforms:Lt([he.common,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.roughnessmap,he.metalnessmap,he.fog,he.lights,{emissive:{value:new Fe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Oe.meshphysical_vert,fragmentShader:Oe.meshphysical_frag},toon:{uniforms:Lt([he.common,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.gradientmap,he.fog,he.lights,{emissive:{value:new Fe(0)}}]),vertexShader:Oe.meshtoon_vert,fragmentShader:Oe.meshtoon_frag},matcap:{uniforms:Lt([he.common,he.bumpmap,he.normalmap,he.displacementmap,he.fog,{matcap:{value:null}}]),vertexShader:Oe.meshmatcap_vert,fragmentShader:Oe.meshmatcap_frag},points:{uniforms:Lt([he.points,he.fog]),vertexShader:Oe.points_vert,fragmentShader:Oe.points_frag},dashed:{uniforms:Lt([he.common,he.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Oe.linedashed_vert,fragmentShader:Oe.linedashed_frag},depth:{uniforms:Lt([he.common,he.displacementmap]),vertexShader:Oe.depth_vert,fragmentShader:Oe.depth_frag},normal:{uniforms:Lt([he.common,he.bumpmap,he.normalmap,he.displacementmap,{opacity:{value:1}}]),vertexShader:Oe.meshnormal_vert,fragmentShader:Oe.meshnormal_frag},sprite:{uniforms:Lt([he.sprite,he.fog]),vertexShader:Oe.sprite_vert,fragmentShader:Oe.sprite_frag},background:{uniforms:{uvTransform:{value:new Le},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Oe.background_vert,fragmentShader:Oe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Le}},vertexShader:Oe.backgroundCube_vert,fragmentShader:Oe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Oe.cube_vert,fragmentShader:Oe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Oe.equirect_vert,fragmentShader:Oe.equirect_frag},distance:{uniforms:Lt([he.common,he.displacementmap,{referencePosition:{value:new G},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Oe.distance_vert,fragmentShader:Oe.distance_frag},shadow:{uniforms:Lt([he.lights,he.fog,{color:{value:new Fe(0)},opacity:{value:1}}]),vertexShader:Oe.shadow_vert,fragmentShader:Oe.shadow_frag}};Tn.physical={uniforms:Lt([Tn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Le},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Le},clearcoatNormalScale:{value:new We(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Le},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Le},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Le},sheen:{value:0},sheenColor:{value:new Fe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Le},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Le},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Le},transmissionSamplerSize:{value:new We},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Le},attenuationDistance:{value:0},attenuationColor:{value:new Fe(0)},specularColor:{value:new Fe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Le},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Le},anisotropyVector:{value:new We},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Le}}]),vertexShader:Oe.meshphysical_vert,fragmentShader:Oe.meshphysical_frag};var ga={r:0,b:0,g:0},e0=new ct,qu=new Le;qu.set(-1,0,0,0,1,0,0,0,1);function t0(i,e,t,n,s,r){let o=new Fe(0),a=s===!0?0:1,c,l,h=null,d=0,u=null;function f(x){let R=x.isScene===!0?x.background:null;if(R&&R.isTexture){let S=x.backgroundBlurriness>0;R=e.get(R,S)}return R}function g(x){let R=!1,S=f(x);S===null?m(o,a):S&&S.isColor&&(m(S,1),R=!0);let M=i.xr.getEnvironmentBlendMode();M==="additive"?t.buffers.color.setClear(0,0,0,1,r):M==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(i.autoClear||R)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function b(x,R){let S=f(R);S&&(S.isCubeTexture||S.mapping===$s)?(l===void 0&&(l=new Xt(new Qn(1,1,1),new Yt({name:"BackgroundCubeMaterial",uniforms:Mi(Tn.backgroundCube.uniforms),vertexShader:Tn.backgroundCube.vertexShader,fragmentShader:Tn.backgroundCube.fragmentShader,side:Ot,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(M,w,E){this.matrixWorld.copyPosition(E.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(l)),l.material.uniforms.envMap.value=S,l.material.uniforms.backgroundBlurriness.value=R.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=R.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(e0.makeRotationFromEuler(R.backgroundRotation)).transpose(),S.isCubeTexture&&S.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(qu),l.material.toneMapped=He.getTransfer(S.colorSpace)!==Ze,(h!==S||d!==S.version||u!==i.toneMapping)&&(l.material.needsUpdate=!0,h=S,d=S.version,u=i.toneMapping),l.layers.enableAll(),x.unshift(l,l.geometry,l.material,0,0,null)):S&&S.isTexture&&(c===void 0&&(c=new Xt(new bi(2,2),new Yt({name:"BackgroundMaterial",uniforms:Mi(Tn.background.uniforms),vertexShader:Tn.background.vertexShader,fragmentShader:Tn.background.fragmentShader,side:Sn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(c)),c.material.uniforms.t2D.value=S,c.material.uniforms.backgroundIntensity.value=R.backgroundIntensity,c.material.toneMapped=He.getTransfer(S.colorSpace)!==Ze,S.matrixAutoUpdate===!0&&S.updateMatrix(),c.material.uniforms.uvTransform.value.copy(S.matrix),(h!==S||d!==S.version||u!==i.toneMapping)&&(c.material.needsUpdate=!0,h=S,d=S.version,u=i.toneMapping),c.layers.enableAll(),x.unshift(c,c.geometry,c.material,0,0,null))}function m(x,R){x.getRGB(ga,Qc(i)),t.buffers.color.setClear(ga.r,ga.g,ga.b,R,r)}function p(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(x,R=1){o.set(x),a=R,m(o,a)},getClearAlpha:function(){return a},setClearAlpha:function(x){a=x,m(o,a)},render:g,addToRenderList:b,dispose:p}}function n0(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=u(null),r=s,o=!1;function a(I,k,L,C,F){let H=!1,V=d(I,C,L,k);r!==V&&(r=V,l(r.object)),H=f(I,C,L,F),H&&g(I,C,L,F),F!==null&&e.update(F,i.ELEMENT_ARRAY_BUFFER),(H||o)&&(o=!1,S(I,k,L,C),F!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(F).buffer))}function c(){return i.createVertexArray()}function l(I){return i.bindVertexArray(I)}function h(I){return i.deleteVertexArray(I)}function d(I,k,L,C){let F=C.wireframe===!0,H=n[k.id];H===void 0&&(H={},n[k.id]=H);let V=I.isInstancedMesh===!0?I.id:0,q=H[V];q===void 0&&(q={},H[V]=q);let X=q[L.id];X===void 0&&(X={},q[L.id]=X);let K=X[F];return K===void 0&&(K=u(c()),X[F]=K),K}function u(I){let k=[],L=[],C=[];for(let F=0;F<t;F++)k[F]=0,L[F]=0,C[F]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:k,enabledAttributes:L,attributeDivisors:C,object:I,attributes:{},index:null}}function f(I,k,L,C){let F=r.attributes,H=k.attributes,V=0,q=L.getAttributes();for(let X in q)if(q[X].location>=0){let Z=F[X],be=H[X];if(be===void 0&&(X==="instanceMatrix"&&I.instanceMatrix&&(be=I.instanceMatrix),X==="instanceColor"&&I.instanceColor&&(be=I.instanceColor)),Z===void 0||Z.attribute!==be||be&&Z.data!==be.data)return!0;V++}return r.attributesNum!==V||r.index!==C}function g(I,k,L,C){let F={},H=k.attributes,V=0,q=L.getAttributes();for(let X in q)if(q[X].location>=0){let Z=H[X];Z===void 0&&(X==="instanceMatrix"&&I.instanceMatrix&&(Z=I.instanceMatrix),X==="instanceColor"&&I.instanceColor&&(Z=I.instanceColor));let be={};be.attribute=Z,Z&&Z.data&&(be.data=Z.data),F[X]=be,V++}r.attributes=F,r.attributesNum=V,r.index=C}function b(){let I=r.newAttributes;for(let k=0,L=I.length;k<L;k++)I[k]=0}function m(I){p(I,0)}function p(I,k){let L=r.newAttributes,C=r.enabledAttributes,F=r.attributeDivisors;L[I]=1,C[I]===0&&(i.enableVertexAttribArray(I),C[I]=1),F[I]!==k&&(i.vertexAttribDivisor(I,k),F[I]=k)}function x(){let I=r.newAttributes,k=r.enabledAttributes;for(let L=0,C=k.length;L<C;L++)k[L]!==I[L]&&(i.disableVertexAttribArray(L),k[L]=0)}function R(I,k,L,C,F,H,V){V===!0?i.vertexAttribIPointer(I,k,L,F,H):i.vertexAttribPointer(I,k,L,C,F,H)}function S(I,k,L,C){b();let F=C.attributes,H=L.getAttributes(),V=k.defaultAttributeValues;for(let q in H){let X=H[q];if(X.location>=0){let K=F[q];if(K===void 0&&(q==="instanceMatrix"&&I.instanceMatrix&&(K=I.instanceMatrix),q==="instanceColor"&&I.instanceColor&&(K=I.instanceColor)),K!==void 0){let Z=K.normalized,be=K.itemSize,ve=e.get(K);if(ve===void 0)continue;let nt=ve.buffer,$e=ve.type,Ye=ve.bytesPerElement,Y=$e===i.INT||$e===i.UNSIGNED_INT||K.gpuType===Io;if(K.isInterleavedBufferAttribute){let te=K.data,_e=te.stride,ke=K.offset;if(te.isInstancedInterleavedBuffer){for(let me=0;me<X.locationSize;me++)p(X.location+me,te.meshPerAttribute);I.isInstancedMesh!==!0&&C._maxInstanceCount===void 0&&(C._maxInstanceCount=te.meshPerAttribute*te.count)}else for(let me=0;me<X.locationSize;me++)m(X.location+me);i.bindBuffer(i.ARRAY_BUFFER,nt);for(let me=0;me<X.locationSize;me++)R(X.location+me,be/X.locationSize,$e,Z,_e*Ye,(ke+be/X.locationSize*me)*Ye,Y)}else{if(K.isInstancedBufferAttribute){for(let te=0;te<X.locationSize;te++)p(X.location+te,K.meshPerAttribute);I.isInstancedMesh!==!0&&C._maxInstanceCount===void 0&&(C._maxInstanceCount=K.meshPerAttribute*K.count)}else for(let te=0;te<X.locationSize;te++)m(X.location+te);i.bindBuffer(i.ARRAY_BUFFER,nt);for(let te=0;te<X.locationSize;te++)R(X.location+te,be/X.locationSize,$e,Z,be*Ye,be/X.locationSize*te*Ye,Y)}}else if(V!==void 0){let Z=V[q];if(Z!==void 0)switch(Z.length){case 2:i.vertexAttrib2fv(X.location,Z);break;case 3:i.vertexAttrib3fv(X.location,Z);break;case 4:i.vertexAttrib4fv(X.location,Z);break;default:i.vertexAttrib1fv(X.location,Z)}}}}x()}function M(){T();for(let I in n){let k=n[I];for(let L in k){let C=k[L];for(let F in C){let H=C[F];for(let V in H)h(H[V].object),delete H[V];delete C[F]}}delete n[I]}}function w(I){if(n[I.id]===void 0)return;let k=n[I.id];for(let L in k){let C=k[L];for(let F in C){let H=C[F];for(let V in H)h(H[V].object),delete H[V];delete C[F]}}delete n[I.id]}function E(I){for(let k in n){let L=n[k];for(let C in L){let F=L[C];if(F[I.id]===void 0)continue;let H=F[I.id];for(let V in H)h(H[V].object),delete H[V];delete F[I.id]}}}function y(I){for(let k in n){let L=n[k],C=I.isInstancedMesh===!0?I.id:0,F=L[C];if(F!==void 0){for(let H in F){let V=F[H];for(let q in V)h(V[q].object),delete V[q];delete F[H]}delete L[C],Object.keys(L).length===0&&delete n[k]}}}function T(){P(),o=!0,r!==s&&(r=s,l(r.object))}function P(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:T,resetDefaultState:P,dispose:M,releaseStatesOfGeometry:w,releaseStatesOfObject:y,releaseStatesOfProgram:E,initAttributes:b,enableAttribute:m,disableUnusedAttributes:x}}function i0(i,e,t){let n;function s(c){n=c}function r(c,l){i.drawArrays(n,c,l),t.update(l,n,1)}function o(c,l,h){h!==0&&(i.drawArraysInstanced(n,c,l,h),t.update(l,n,h))}function a(c,l,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,l,0,h);let u=0;for(let f=0;f<h;f++)u+=l[f];t.update(u,n,1)}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a}function s0(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let E=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(E.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(E){return!(E!==tn&&n.convert(E)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(E){let y=E===dn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(E!==$t&&E!==un&&!y&&n.convert(E)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function c(E){if(E==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";E="mediump"}return E==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp",h=c(l);h!==l&&(Ce("WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);let d=t.logarithmicDepthBuffer===!0,u=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&u===!1&&Ce("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),b=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),x=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),R=i.getParameter(i.MAX_VARYING_VECTORS),S=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),M=i.getParameter(i.MAX_SAMPLES),w=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:u,maxTextures:f,maxVertexTextures:g,maxTextureSize:b,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:x,maxVaryings:R,maxFragmentUniforms:S,maxSamples:M,samples:w}}function r0(i){let e=this,t=null,n=0,s=!1,r=!1,o=new an,a=new Le,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){let f=d.length!==0||u||n!==0||s;return s=u,n=d.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,u){t=h(d,u,0)},this.setState=function(d,u,f){let g=d.clippingPlanes,b=d.clipIntersection,m=d.clipShadows,p=i.get(d);if(!s||g===null||g.length===0||r&&!m)r?h(null):l();else{let x=r?0:n,R=x*4,S=p.clippingState||null;c.value=S,S=h(g,u,R,f);for(let M=0;M!==R;++M)S[M]=t[M];p.clippingState=S,this.numIntersection=b?this.numPlanes:0,this.numPlanes+=x}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(d,u,f,g){let b=d!==null?d.length:0,m=null;if(b!==0){if(m=c.value,g!==!0||m===null){let p=f+b*4,x=u.matrixWorldInverse;a.getNormalMatrix(x),(m===null||m.length<p)&&(m=new Float32Array(p));for(let R=0,S=f;R!==b;++R,S+=4)o.copy(d[R]).applyMatrix4(x,a),o.normal.toArray(m,S),m[S+3]=o.constant}c.value=m,c.needsUpdate=!0}return e.numPlanes=b,e.numIntersection=0,m}}var os=4,o0=6,a0=20,c0=256,tr=new es,Au=new Fe,il=null,sl=0,rl=0,ol=!1,l0=new G,wi=new G,ya=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,s=100,r={}){let{size:o=256,position:a=l0}=r;il=this._renderer.getRenderTarget(),sl=this._renderer.getActiveCubeFace(),rl=this._renderer.getActiveMipmapLevel(),ol=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(e,n,s,c,a),t>0&&this._blur(c,0,0,t),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Cu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ru(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(il,sl,rl),this._renderer.xr.enabled=ol,e.scissorTest=!1,rs(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===ii||e.mapping===Si?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),il=this._renderer.getRenderTarget(),sl=this._renderer.getActiveCubeFace(),rl=this._renderer.getActiveMipmapLevel(),ol=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Tt,minFilter:Tt,generateMipmaps:!1,type:dn,format:tn,colorSpace:As,depthBuffer:!1},s=Eu(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Eu(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=h0(r)),this._blurMaterial=d0(r,e,t),this._ggxMaterial=u0(r,e,t)}return s}_compileMaterial(e){let t=new Xt(new Wt,e);this._renderer.compile(t,tr)}_sceneToCubeUV(e,t,n,s,r){let c=new Pt(90,1,t,n),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],d=this._renderer,u=d.autoClear,f=d.toneMapping;d.getClearColor(Au),d.toneMapping=ln,d.autoClear=!1,d.state.buffers.depth.getReversed()&&(d.setRenderTarget(s),d.clearDepth(),d.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Xt(new Qn,new Ds({name:"PMREM.Background",side:Ot,depthWrite:!1,depthTest:!1})));let b=this._backgroundBox,m=b.material,p=!1,x=e.background;x?x.isColor&&(m.color.copy(x),e.background=null,p=!0):(m.color.copy(Au),p=!0);for(let R=0;R<6;R++){let S=R%3;S===0?(c.up.set(0,l[R],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x+h[R],r.y,r.z)):S===1?(c.up.set(0,0,l[R]),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y+h[R],r.z)):(c.up.set(0,l[R],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y,r.z+h[R]));let M=this._cubeSize;rs(s,S*M,R>2?M:0,M,M),d.setRenderTarget(s),p&&d.render(b,c),d.render(e,c)}d.toneMapping=f,d.autoClear=u,e.background=x}_textureToCubeUV(e,t){let n=this._renderer,s=e.mapping===ii||e.mapping===Si;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Cu()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ru());let r=s?this._cubemapMaterial:this._equirectMaterial,o=this._lodMeshes[0];o.material=r;let a=r.uniforms;a.envMap.value=e;let c=this._cubeSize;rs(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(o,tr)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(e,r-1,r);t.autoClear=n}_applyGGXFilter(e,t,n){let s=this._renderer,r=this._pingPongRenderTarget,o=this._ggxMaterial,a=this._lodMeshes[n];a.material=o;let c=o.uniforms,l=n/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),d=Math.sqrt(l*l-h*h),u=l*1.25,f=d*u,{_lodMax:g}=this,b=this._sizeLods[n],m=3*b*(n>g-os?n-g+os:0),p=4*(this._cubeSize-b);c.envMap.value=e.texture,c.roughness.value=f,c.mipInt.value=g-t,rs(r,m,p,3*b,2*b),s.setRenderTarget(r),s.render(a,tr),c.envMap.value=r.texture,c.roughness.value=0,c.mipInt.value=g-n,rs(e,m,p,3*b,2*b),s.setRenderTarget(e),s.render(a,tr)}_blur(e,t,n,s){let r=this._pingPongRenderTarget,o=Math.min(s,Math.PI)/Math.SQRT2;this._blurPass(e,r,t,n,o),this._blurPass(r,e,n,n,o)}_blurPass(e,t,n,s,r){let o=this._renderer,a=this._blurMaterial,c=this._lodMeshes[s];c.material=a;let l=a.uniforms;l.envMap.value=e.texture,l.sigma.value=r,l.mipInt.value=this._lodMax-n;let h=this._sizeLods[s],d=3*h*(s>this._lodMax-os?s-this._lodMax+os:0),u=4*(this._cubeSize-h);rs(t,d,u,3*h,2*h),o.setRenderTarget(t),o.render(c,tr)}};function h0(i){let e=[],t=[],n=i,s=i-os+1+o0;for(let r=0;r<s;r++){let o=Math.pow(2,n);e.push(o);let a=1/(o-2),c=-a,l=1+a,h=[c,c,l,c,l,l,c,c,l,l,c,l],d=6,u=6,f=3,g=new Float32Array(f*u*d),b=new Float32Array(f*u*d);for(let p=0;p<d;p++){let x=p%3*2/3-1,R=p>2?0:-1,S=[x,R,0,x+2/3,R,0,x+2/3,R+1,0,x,R,0,x+2/3,R+1,0,x,R+1,0];g.set(S,f*u*p);for(let M=0;M<u;M++){let w=h[M*2]*2-1,E=h[M*2+1]*2-1;p===0?wi.set(1,E,w):p===1?wi.set(-w,1,-E):p===2?wi.set(-w,E,1):p===3?wi.set(-1,E,-w):p===4?wi.set(-w,-1,E):wi.set(w,E,-1),wi.toArray(b,(p*u+M)*f)}}let m=new Wt;m.setAttribute("position",new Ft(g,f)),m.setAttribute("outputDirection",new Ft(b,f)),t.push(new Xt(m,null)),n>os&&n--}return{lodMeshes:t,sizeLods:e}}function Eu(i,e,t){let n=new Ht(i,e,t);return n.texture.mapping=$s,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function rs(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function u0(i,e,t){return new Yt({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:c0,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:va(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:Mn,depthTest:!1,depthWrite:!1})}function d0(i,e,t){return new Yt({name:"SphericalGaussianBlur",defines:{SAMPLES:a0,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:va(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:Mn,depthTest:!1,depthWrite:!1})}function Ru(){return new Yt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:va(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Mn,depthTest:!1,depthWrite:!1})}function Cu(){return new Yt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:va(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Mn,depthTest:!1,depthWrite:!1})}function va(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var xa=class extends Ht{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new Ns(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Qn(5,5,5),r=new Yt({name:"CubemapFromEquirect",uniforms:Mi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ot,blending:Mn});r.uniforms.tEquirect.value=t;let o=new Xt(s,r),a=t.minFilter;return t.minFilter===si&&(t.minFilter=Tt),new Ao(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,n=!0,s=!0){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,s);e.setRenderTarget(r)}};function f0(i){let e=new WeakMap,t=new WeakMap,n=null;function s(u,f=!1){return u==null?null:f?o(u):r(u)}function r(u){if(u&&u.isTexture){let f=u.mapping;if(f===Ro||f===Co)if(e.has(u)){let g=e.get(u).texture;return a(g,u.mapping)}else{let g=u.image;if(g&&g.height>0){let b=new xa(g.height);return b.fromEquirectangularTexture(i,u),e.set(u,b),u.addEventListener("dispose",l),a(b.texture,u.mapping)}else return null}}return u}function o(u){if(u&&u.isTexture){let f=u.mapping,g=f===Ro||f===Co,b=f===ii||f===Si;if(g||b){let m=t.get(u),p=m!==void 0?m.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==p)return n===null&&(n=new ya(i)),m=g?n.fromEquirectangular(u,m):n.fromCubemap(u,m),m.texture.pmremVersion=u.pmremVersion,t.set(u,m),m.texture;if(m!==void 0)return m.texture;{let x=u.image;return g&&x&&x.height>0||b&&x&&c(x)?(n===null&&(n=new ya(i)),m=g?n.fromEquirectangular(u):n.fromCubemap(u),m.texture.pmremVersion=u.pmremVersion,t.set(u,m),u.addEventListener("dispose",h),m.texture):null}}}return u}function a(u,f){return f===Ro?u.mapping=ii:f===Co&&(u.mapping=Si),u}function c(u){let f=0,g=6;for(let b=0;b<g;b++)u[b]!==void 0&&f++;return f===g}function l(u){let f=u.target;f.removeEventListener("dispose",l);let g=e.get(f);g!==void 0&&(e.delete(f),g.dispose())}function h(u){let f=u.target;f.removeEventListener("dispose",h);let g=t.get(f);g!==void 0&&(t.delete(f),g.dispose())}function d(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:d}}function p0(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s=i.getExtension(n);return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let s=t(n);return s===null&&xi("WebGLRenderer: "+n+" extension not supported."),s}}}function m0(i,e,t,n){let s={},r=new WeakMap;function o(d){let u=d.target;u.index!==null&&e.remove(u.index);for(let g in u.attributes)e.remove(u.attributes[g]);u.removeEventListener("dispose",o),delete s[u.id];let f=r.get(u);f&&(e.remove(f),r.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,t.memory.geometries--}function a(d,u){return s[u.id]===!0||(u.addEventListener("dispose",o),s[u.id]=!0,t.memory.geometries++),u}function c(d){let u=d.attributes;for(let f in u)e.update(u[f],i.ARRAY_BUFFER)}function l(d){let u=[],f=d.index,g=d.attributes.position,b=0;if(g===void 0)return;if(f!==null){let x=f.array;b=f.version;for(let R=0,S=x.length;R<S;R+=3){let M=x[R+0],w=x[R+1],E=x[R+2];u.push(M,w,w,E,E,M)}}else{let x=g.array;b=g.version;for(let R=0,S=x.length/3-1;R<S;R+=3){let M=R+0,w=R+1,E=R+2;u.push(M,w,w,E,E,M)}}let m=new(g.count>=65535?ks:Ls)(u,1);m.version=b;let p=r.get(d);p&&e.remove(p),r.set(d,m)}function h(d){let u=r.get(d);if(u){let f=d.index;f!==null&&u.version<f.version&&l(d)}else l(d);return r.get(d)}return{get:a,update:c,getWireframeAttribute:h}}function g0(i,e,t){let n;function s(d){n=d}let r,o;function a(d){r=d.type,o=d.bytesPerElement}function c(d,u){i.drawElements(n,u,r,d*o),t.update(u,n,1)}function l(d,u,f){f!==0&&(i.drawElementsInstanced(n,u,r,d*o,f),t.update(u,n,f))}function h(d,u,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,u,0,r,d,0,f);let b=0;for(let m=0;m<f;m++)b+=u[m];t.update(b,n,1)}this.setMode=s,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=h}function _0(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(t.calls++,o){case i.TRIANGLES:t.triangles+=a*(r/3);break;case i.LINES:t.lines+=a*(r/2);break;case i.LINE_STRIP:t.lines+=a*(r-1);break;case i.LINE_LOOP:t.lines+=a*r;break;case i.POINTS:t.points+=a*r;break;default:Pe("WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function y0(i,e,t){let n=new WeakMap,s=new ht;function r(o,a,c){let l=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,d=h!==void 0?h.length:0,u=n.get(a);if(u===void 0||u.count!==d){let T=function(){E.dispose(),n.delete(a),a.removeEventListener("dispose",T)};u!==void 0&&u.texture.dispose();let f=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,b=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],x=a.morphAttributes.color||[],R=0;f===!0&&(R=1),g===!0&&(R=2),b===!0&&(R=3);let S=a.attributes.position.count*R,M=1;S>e.maxTextureSize&&(M=Math.ceil(S/e.maxTextureSize),S=e.maxTextureSize);let w=new Float32Array(S*M*4*d),E=new Cs(w,S,M,d);E.type=un,E.needsUpdate=!0;let y=R*4;for(let P=0;P<d;P++){let I=m[P],k=p[P],L=x[P],C=S*M*4*P;for(let F=0;F<I.count;F++){let H=F*y;f===!0&&(s.fromBufferAttribute(I,F),w[C+H+0]=s.x,w[C+H+1]=s.y,w[C+H+2]=s.z,w[C+H+3]=0),g===!0&&(s.fromBufferAttribute(k,F),w[C+H+4]=s.x,w[C+H+5]=s.y,w[C+H+6]=s.z,w[C+H+7]=0),b===!0&&(s.fromBufferAttribute(L,F),w[C+H+8]=s.x,w[C+H+9]=s.y,w[C+H+10]=s.z,w[C+H+11]=L.itemSize===4?s.w:1)}}u={count:d,texture:E,size:new We(S,M)},n.set(a,u),a.addEventListener("dispose",T)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",o.morphTexture,t);else{let f=0;for(let b=0;b<l.length;b++)f+=l[b];let g=a.morphTargetsRelative?1:1-f;c.getUniforms().setValue(i,"morphTargetBaseInfluence",g),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",u.texture,t),c.getUniforms().setValue(i,"morphTargetsTextureSize",u.size)}return{update:r}}function x0(i,e,t,n,s){let r=new WeakMap;function o(l){let h=s.render.frame,d=l.geometry,u=e.get(l,d);if(r.get(u)!==h&&(e.update(u),r.set(u,h)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),r.get(l)!==h&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),r.set(l,h))),l.isSkinnedMesh){let f=l.skeleton;r.get(f)!==h&&(f.update(),r.set(f,h))}return u}function a(){r=new WeakMap}function c(l){let h=l.target;h.removeEventListener("dispose",c),n.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:o,dispose:a}}var b0={[Uc]:"LINEAR_TONE_MAPPING",[Fc]:"REINHARD_TONE_MAPPING",[Oc]:"CINEON_TONE_MAPPING",[Bc]:"ACES_FILMIC_TONE_MAPPING",[Vc]:"AGX_TONE_MAPPING",[Gc]:"NEUTRAL_TONE_MAPPING",[zc]:"CUSTOM_TONE_MAPPING"};function v0(i,e,t,n,s,r){let o=new Ht(e,t,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),a=null,c=null,l=new Wt;l.setAttribute("position",new vt([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new vt([0,2,0,0,2,0],2));let h=new uo({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),d=new Xt(l,h),u=new es(-1,1,1,-1,0,1),f=null,g=null,b=!1,m,p=null,x=[],R=!1;this.setSize=function(S,M){o.setSize(S,M),a!==null&&a.setSize(S,M),c!==null&&c.setSize(S,M);for(let w=0;w<x.length;w++){let E=x[w];E.setSize&&E.setSize(S,M)}},this.setEffects=function(S){x=S,R=x.length>0&&x[0].isRenderPass===!0;let M=o.width,w=o.height;x.length>0&&a===null&&(a=new Ht(M,w,{type:dn,depthBuffer:!1,stencilBuffer:!1}),c=new Ht(M,w,{type:dn,depthBuffer:!1,stencilBuffer:!1}));for(let E=0;E<x.length;E++){let y=x[E];y.setSize&&y.setSize(M,w)}},this.begin=function(S,M){if(b||S.toneMapping===ln&&x.length===0)return!1;if(p=M,M!==null){let w=M.width,E=M.height;(o.width!==w||o.height!==E)&&this.setSize(w,E)}return R===!1&&S.setRenderTarget(o),m=S.toneMapping,S.toneMapping=ln,!0},this.hasRenderPass=function(){return R},this.end=function(S,M){S.toneMapping=m,b=!0;let w=o,E=a;for(let y=0;y<x.length;y++){let T=x[y];T.enabled!==!1&&(T.render(S,E,w,M),T.needsSwap!==!1&&(w=E,E=E===a?c:a))}if(f!==S.outputColorSpace||g!==S.toneMapping){f=S.outputColorSpace,g=S.toneMapping,h.defines={},He.getTransfer(f)===Ze&&(h.defines.SRGB_TRANSFER="");let y=b0[g];y&&(h.defines[y]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=w.texture,S.setRenderTarget(p),S.render(d,u),p=null,b=!1},this.isCompositing=function(){return b},this.dispose=function(){o.dispose(),a!==null&&a.dispose(),c!==null&&c.dispose(),l.dispose(),h.dispose()}}var Yu=new Gt,ll=new Zn(1,1),Ju=new Cs,Ku=new ao,Zu=new Ns,Pu=[],Iu=[],Lu=new Float32Array(16),ku=new Float32Array(9),Du=new Float32Array(4);function cs(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=Pu[s];if(r===void 0&&(r=new Float32Array(s),Pu[s]=r),e!==0){n.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,i[o].toArray(r,a)}return r}function _t(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function yt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function Sa(i,e){let t=Iu[e];t===void 0&&(t=new Int32Array(e),Iu[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function S0(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function M0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(_t(t,e))return;i.uniform2fv(this.addr,e),yt(t,e)}}function w0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(_t(t,e))return;i.uniform3fv(this.addr,e),yt(t,e)}}function T0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(_t(t,e))return;i.uniform4fv(this.addr,e),yt(t,e)}}function A0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(_t(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),yt(t,e)}else{if(_t(t,n))return;Du.set(n),i.uniformMatrix2fv(this.addr,!1,Du),yt(t,n)}}function E0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(_t(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),yt(t,e)}else{if(_t(t,n))return;ku.set(n),i.uniformMatrix3fv(this.addr,!1,ku),yt(t,n)}}function R0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(_t(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),yt(t,e)}else{if(_t(t,n))return;Lu.set(n),i.uniformMatrix4fv(this.addr,!1,Lu),yt(t,n)}}function C0(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function P0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(_t(t,e))return;i.uniform2iv(this.addr,e),yt(t,e)}}function I0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(_t(t,e))return;i.uniform3iv(this.addr,e),yt(t,e)}}function L0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(_t(t,e))return;i.uniform4iv(this.addr,e),yt(t,e)}}function k0(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function D0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(_t(t,e))return;i.uniform2uiv(this.addr,e),yt(t,e)}}function N0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(_t(t,e))return;i.uniform3uiv(this.addr,e),yt(t,e)}}function U0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(_t(t,e))return;i.uniform4uiv(this.addr,e),yt(t,e)}}function F0(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(ll.compareFunction=t.isReversedDepthBuffer()?ma:pa,r=ll):r=Yu,t.setTexture2D(e||r,s)}function O0(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||Ku,s)}function B0(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||Zu,s)}function z0(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||Ju,s)}function V0(i){switch(i){case 5126:return S0;case 35664:return M0;case 35665:return w0;case 35666:return T0;case 35674:return A0;case 35675:return E0;case 35676:return R0;case 5124:case 35670:return C0;case 35667:case 35671:return P0;case 35668:case 35672:return I0;case 35669:case 35673:return L0;case 5125:return k0;case 36294:return D0;case 36295:return N0;case 36296:return U0;case 35678:case 36198:case 36298:case 36306:case 35682:return F0;case 35679:case 36299:case 36307:return O0;case 35680:case 36300:case 36308:case 36293:return B0;case 36289:case 36303:case 36311:case 36292:return z0}}function G0(i,e){i.uniform1fv(this.addr,e)}function H0(i,e){let t=cs(e,this.size,2);i.uniform2fv(this.addr,t)}function W0(i,e){let t=cs(e,this.size,3);i.uniform3fv(this.addr,t)}function X0(i,e){let t=cs(e,this.size,4);i.uniform4fv(this.addr,t)}function $0(i,e){let t=cs(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function j0(i,e){let t=cs(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function q0(i,e){let t=cs(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function Y0(i,e){i.uniform1iv(this.addr,e)}function J0(i,e){i.uniform2iv(this.addr,e)}function K0(i,e){i.uniform3iv(this.addr,e)}function Z0(i,e){i.uniform4iv(this.addr,e)}function Q0(i,e){i.uniform1uiv(this.addr,e)}function e_(i,e){i.uniform2uiv(this.addr,e)}function t_(i,e){i.uniform3uiv(this.addr,e)}function n_(i,e){i.uniform4uiv(this.addr,e)}function i_(i,e,t){let n=this.cache,s=e.length,r=Sa(t,s);_t(n,r)||(i.uniform1iv(this.addr,r),yt(n,r));let o;this.type===i.SAMPLER_2D_SHADOW?o=ll:o=Yu;for(let a=0;a!==s;++a)t.setTexture2D(e[a]||o,r[a])}function s_(i,e,t){let n=this.cache,s=e.length,r=Sa(t,s);_t(n,r)||(i.uniform1iv(this.addr,r),yt(n,r));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||Ku,r[o])}function r_(i,e,t){let n=this.cache,s=e.length,r=Sa(t,s);_t(n,r)||(i.uniform1iv(this.addr,r),yt(n,r));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||Zu,r[o])}function o_(i,e,t){let n=this.cache,s=e.length,r=Sa(t,s);_t(n,r)||(i.uniform1iv(this.addr,r),yt(n,r));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||Ju,r[o])}function a_(i){switch(i){case 5126:return G0;case 35664:return H0;case 35665:return W0;case 35666:return X0;case 35674:return $0;case 35675:return j0;case 35676:return q0;case 5124:case 35670:return Y0;case 35667:case 35671:return J0;case 35668:case 35672:return K0;case 35669:case 35673:return Z0;case 5125:return Q0;case 36294:return e_;case 36295:return t_;case 36296:return n_;case 35678:case 36198:case 36298:case 36306:case 35682:return i_;case 35679:case 36299:case 36307:return s_;case 35680:case 36300:case 36308:case 36293:return r_;case 36289:case 36303:case 36311:case 36292:return o_}}var hl=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=V0(t.type)}},ul=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=a_(t.type)}},dl=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(e,t[a.id],n)}}},al=/(\w+)(\])?(\[|\.)?/g;function Nu(i,e){i.seq.push(e),i.map[e.id]=e}function c_(i,e,t){let n=i.name,s=n.length;for(al.lastIndex=0;;){let r=al.exec(n),o=al.lastIndex,a=r[1],c=r[2]==="]",l=r[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===s){Nu(t,l===void 0?new hl(a,i,e):new ul(a,i,e));break}else{let d=t.map[a];d===void 0&&(d=new dl(a),Nu(t,d)),t=d}}}var as=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let o=0;o<n;++o){let a=e.getActiveUniform(t,o),c=e.getUniformLocation(t,a.name);c_(a,c,this)}let s=[],r=[];for(let o of this.seq)o.type===e.SAMPLER_2D_SHADOW||o.type===e.SAMPLER_CUBE_SHADOW||o.type===e.SAMPLER_2D_ARRAY_SHADOW?s.push(o):r.push(o);s.length>0&&(this.seq=s.concat(r))}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,o=t.length;r!==o;++r){let a=t[r],c=n[a.id];c.needsUpdate!==!1&&a.setValue(e,c.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let o=e[s];o.id in t&&n.push(o)}return n}};function Uu(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var l_=37297,h_=0;function u_(i,e){let t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=s;o<r;o++){let a=o+1;n.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return n.join(`
`)}var Fu=new Le;function d_(i){He._getMatrix(Fu,He.workingColorSpace,i);let e=`mat3( ${Fu.elements.map(t=>t.toFixed(4))} )`;switch(He.getTransfer(i)){case Es:return[e,"LinearTransferOETF"];case Ze:return[e,"sRGBTransferOETF"];default:return Ce("WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function Ou(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),r=(i.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";let o=/ERROR: 0:(\d+)/.exec(r);if(o){let a=parseInt(o[1]);return t.toUpperCase()+`

`+r+`

`+u_(i.getShaderSource(e),a)}else return r}function f_(i,e){let t=d_(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var p_={[Uc]:"Linear",[Fc]:"Reinhard",[Oc]:"Cineon",[Bc]:"ACESFilmic",[Vc]:"AgX",[Gc]:"Neutral",[zc]:"Custom"};function m_(i,e){let t=p_[e];return t===void 0?(Ce("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var _a=new G;function g_(){He.getLuminanceCoefficients(_a);let i=_a.x.toFixed(4),e=_a.y.toFixed(4),t=_a.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function __(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ir).join(`
`)}function y_(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function x_(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),o=r.name,a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:i.getAttribLocation(e,o),locationSize:a}}return t}function ir(i){return i!==""}function Bu(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function zu(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var b_=/^[ \t]*#include +<([\w\d./]+)>/gm;function fl(i){return i.replace(b_,S_)}var v_=new Map;function S_(i,e){let t=Oe[e];if(t===void 0){let n=v_.get(e);if(n!==void 0)t=Oe[n],Ce('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return fl(t)}var M_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Vu(i){return i.replace(M_,w_)}function w_(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Gu(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}var T_={[Xs]:"SHADOWMAP_TYPE_PCF",[ts]:"SHADOWMAP_TYPE_VSM"};function A_(i){return T_[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var E_={[ii]:"ENVMAP_TYPE_CUBE",[Si]:"ENVMAP_TYPE_CUBE",[$s]:"ENVMAP_TYPE_CUBE_UV"};function R_(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":E_[i.envMapMode]||"ENVMAP_TYPE_CUBE"}var C_={[Si]:"ENVMAP_MODE_REFRACTION"};function P_(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":C_[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}var I_={[Nc]:"ENVMAP_BLENDING_MULTIPLY",[ru]:"ENVMAP_BLENDING_MIX",[ou]:"ENVMAP_BLENDING_ADD"};function L_(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":I_[i.combine]||"ENVMAP_BLENDING_NONE"}function k_(i){let e=i.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function D_(i,e,t,n){let s=i.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,c=A_(t),l=R_(t),h=P_(t),d=L_(t),u=k_(t),f=__(t),g=y_(r),b=s.createProgram(),m,p,x=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ir).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ir).join(`
`),p.length>0&&(p+=`
`)):(m=[Gu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ir).join(`
`),p=[Gu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+h:"",t.envMap?"#define "+d:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==ln?"#define TONE_MAPPING":"",t.toneMapping!==ln?Oe.tonemapping_pars_fragment:"",t.toneMapping!==ln?m_("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Oe.colorspace_pars_fragment,f_("linearToOutputTexel",t.outputColorSpace),g_(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(ir).join(`
`)),o=fl(o),o=Bu(o,t),o=zu(o,t),a=fl(a),a=Bu(a,t),a=zu(a,t),o=Vu(o),a=Vu(a),t.isRawShaderMaterial!==!0&&(x=`#version 300 es
`,m=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",t.glslVersion===Kc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Kc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let R=x+m+o,S=x+p+a,M=Uu(s,s.VERTEX_SHADER,R),w=Uu(s,s.FRAGMENT_SHADER,S);s.attachShader(b,M),s.attachShader(b,w),t.index0AttributeName!==void 0?s.bindAttribLocation(b,0,t.index0AttributeName):t.hasPositionAttribute===!0&&s.bindAttribLocation(b,0,"position"),s.linkProgram(b);function E(I){if(i.debug.checkShaderErrors){let k=s.getProgramInfoLog(b)||"",L=s.getShaderInfoLog(M)||"",C=s.getShaderInfoLog(w)||"",F=k.trim(),H=L.trim(),V=C.trim(),q=!0,X=!0;if(s.getProgramParameter(b,s.LINK_STATUS)===!1)if(q=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,b,M,w);else{let K=Ou(s,M,"vertex"),Z=Ou(s,w,"fragment");Pe("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(b,s.VALIDATE_STATUS)+`

Material Name: `+I.name+`
Material Type: `+I.type+`

Program Info Log: `+F+`
`+K+`
`+Z)}else F!==""?Ce("WebGLProgram: Program Info Log:",F):(H===""||V==="")&&(X=!1);X&&(I.diagnostics={runnable:q,programLog:F,vertexShader:{log:H,prefix:m},fragmentShader:{log:V,prefix:p}})}s.deleteShader(M),s.deleteShader(w),y=new as(s,b),T=x_(s,b)}let y;this.getUniforms=function(){return y===void 0&&E(this),y};let T;this.getAttributes=function(){return T===void 0&&E(this),T};let P=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return P===!1&&(P=s.getProgramParameter(b,l_)),P},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(b),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=h_++,this.cacheKey=e,this.usedTimes=1,this.program=b,this.vertexShader=M,this.fragmentShader=w,this}var N_=0,pl=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let s=this._getShaderCacheForMaterial(e);return s.has(t)===!1&&(s.add(t),t.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new ml(e),t.set(e,n)),n}},ml=class{constructor(e){this.id=N_++,this.code=e,this.usedTimes=0}};function U_(i){return i===oi||i===Zs||i===Qs}function F_(i,e,t,n,s,r){let o=new Ps,a=new pl,c=new Set,l=[],h=new Map,d=n.logarithmicDepthBuffer,u=n.precision,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(y){return c.add(y),y===0?"uv":`uv${y}`}function b(y,T,P,I,k,L){let C=I.fog,F=k.geometry,H=y.isMeshStandardMaterial||y.isMeshLambertMaterial||y.isMeshPhongMaterial?I.environment:null,V=y.isMeshStandardMaterial||y.isMeshLambertMaterial&&!y.envMap||y.isMeshPhongMaterial&&!y.envMap,q=e.get(y.envMap||H,V),X=q&&q.mapping===$s?q.image.height:null,K=f[y.type];y.precision!==null&&(u=n.getMaxPrecision(y.precision),u!==y.precision&&Ce("WebGLProgram.getParameters:",y.precision,"not supported, using",u,"instead."));let Z=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,be=Z!==void 0?Z.length:0,ve=0;F.morphAttributes.position!==void 0&&(ve=1),F.morphAttributes.normal!==void 0&&(ve=2),F.morphAttributes.color!==void 0&&(ve=3);let nt,$e,Ye,Y;if(K){let st=Tn[K];nt=st.vertexShader,$e=st.fragmentShader}else{nt=y.vertexShader,$e=y.fragmentShader;let st=a.getVertexShaderStage(y),Je=a.getFragmentShaderStage(y);a.update(y,st,Je),Ye=st.id,Y=Je.id}let te=i.getRenderTarget(),_e=i.state.buffers.depth.getReversed(),ke=k.isInstancedMesh===!0,me=k.isBatchedMesh===!0,Be=!!y.map,gt=!!y.matcap,ze=!!q,qe=!!y.aoMap,it=!!y.lightMap,Ge=!!y.bumpMap&&y.wireframe===!1,lt=!!y.normalMap,xt=!!y.displacementMap,Bt=!!y.emissiveMap,ut=!!y.metalnessMap,ft=!!y.roughnessMap,U=y.anisotropy>0,At=y.clearcoat>0,Qe=y.dispersion>0,A=y.retroreflectivity>0,_=y.iridescence>0,O=y.sheen>0,W=y.transmission>0,j=U&&!!y.anisotropyMap,ie=At&&!!y.clearcoatMap,se=At&&!!y.clearcoatNormalMap,J=At&&!!y.clearcoatRoughnessMap,ee=_&&!!y.iridescenceMap,re=_&&!!y.iridescenceThicknessMap,Te=O&&!!y.sheenColorMap,le=O&&!!y.sheenRoughnessMap,oe=!!y.specularMap,Ae=!!y.specularColorMap,Re=!!y.specularIntensityMap,De=W&&!!y.transmissionMap,N=W&&!!y.thicknessMap,ae=!!y.gradientMap,Q=!!y.alphaMap,ce=y.alphaTest>0,fe=!!y.alphaHash,ne=!!y.extensions,Ee=ln;y.toneMapped&&(te===null||te.isXRRenderTarget===!0)&&(Ee=i.toneMapping);let Me={shaderID:K,shaderType:y.type,shaderName:y.name,vertexShader:nt,fragmentShader:$e,defines:y.defines,customVertexShaderID:Ye,customFragmentShaderID:Y,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:u,batching:me,batchingColor:me&&k._colorsTexture!==null,instancing:ke,instancingColor:ke&&k.instanceColor!==null,instancingMorph:ke&&k.morphTexture!==null,outputColorSpace:te===null?i.outputColorSpace:te.isXRRenderTarget===!0?te.texture.colorSpace:He.workingColorSpace,alphaToCoverage:!!y.alphaToCoverage,map:Be,matcap:gt,envMap:ze,envMapMode:ze&&q.mapping,envMapCubeUVHeight:X,aoMap:qe,lightMap:it,bumpMap:Ge,normalMap:lt,displacementMap:xt,emissiveMap:Bt,normalMapObjectSpace:lt&&y.normalMapType===lu,normalMapTangentSpace:lt&&y.normalMapType===fa,packedNormalMap:lt&&y.normalMapType===fa&&U_(y.normalMap.format),metalnessMap:ut,roughnessMap:ft,anisotropy:U,anisotropyMap:j,clearcoat:At,clearcoatMap:ie,clearcoatNormalMap:se,clearcoatRoughnessMap:J,dispersion:Qe,retroreflection:A,iridescence:_,iridescenceMap:ee,iridescenceThicknessMap:re,sheen:O,sheenColorMap:Te,sheenRoughnessMap:le,specularMap:oe,specularColorMap:Ae,specularIntensityMap:Re,transmission:W,transmissionMap:De,thicknessMap:N,gradientMap:ae,opaque:y.transparent===!1&&y.blending===ns&&y.alphaToCoverage===!1,alphaMap:Q,alphaTest:ce,alphaHash:fe,combine:y.combine,mapUv:Be&&g(y.map.channel),aoMapUv:qe&&g(y.aoMap.channel),lightMapUv:it&&g(y.lightMap.channel),bumpMapUv:Ge&&g(y.bumpMap.channel),normalMapUv:lt&&g(y.normalMap.channel),displacementMapUv:xt&&g(y.displacementMap.channel),emissiveMapUv:Bt&&g(y.emissiveMap.channel),metalnessMapUv:ut&&g(y.metalnessMap.channel),roughnessMapUv:ft&&g(y.roughnessMap.channel),anisotropyMapUv:j&&g(y.anisotropyMap.channel),clearcoatMapUv:ie&&g(y.clearcoatMap.channel),clearcoatNormalMapUv:se&&g(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:J&&g(y.clearcoatRoughnessMap.channel),iridescenceMapUv:ee&&g(y.iridescenceMap.channel),iridescenceThicknessMapUv:re&&g(y.iridescenceThicknessMap.channel),sheenColorMapUv:Te&&g(y.sheenColorMap.channel),sheenRoughnessMapUv:le&&g(y.sheenRoughnessMap.channel),specularMapUv:oe&&g(y.specularMap.channel),specularColorMapUv:Ae&&g(y.specularColorMap.channel),specularIntensityMapUv:Re&&g(y.specularIntensityMap.channel),transmissionMapUv:De&&g(y.transmissionMap.channel),thicknessMapUv:N&&g(y.thicknessMap.channel),alphaMapUv:Q&&g(y.alphaMap.channel),vertexTangents:!!F.attributes.tangent&&(lt||U),vertexNormals:!!F.attributes.normal,vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,pointsUvs:k.isPoints===!0&&!!F.attributes.uv&&(Be||Q),fog:!!C,useFog:y.fog===!0,fogExp2:!!C&&C.isFogExp2,flatShading:y.wireframe===!1&&(y.flatShading===!0||F.attributes.normal===void 0&&lt===!1&&(y.isMeshLambertMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isMeshPhysicalMaterial)),sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:_e,skinning:k.isSkinnedMesh===!0,hasPositionAttribute:F.attributes.position!==void 0,morphTargets:F.morphAttributes.position!==void 0,morphNormals:F.morphAttributes.normal!==void 0,morphColors:F.morphAttributes.color!==void 0,morphTargetsCount:be,morphTextureStride:ve,numSunLights:T.sun.length,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numSunLightShadows:T.sunShadowMap.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numLightProbeGrids:L.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:y.dithering,shadowMapEnabled:i.shadowMap.enabled&&P.length>0,shadowMapType:i.shadowMap.type,toneMapping:Ee,decodeVideoTexture:Be&&y.map.isVideoTexture===!0&&He.getTransfer(y.map.colorSpace)===Ze,decodeVideoTextureEmissive:Bt&&y.emissiveMap.isVideoTexture===!0&&He.getTransfer(y.emissiveMap.colorSpace)===Ze,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===en,flipSided:y.side===Ot,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionClipCullDistance:ne&&y.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ne&&y.extensions.multiDraw===!0||me)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:y.customProgramCacheKey()};return Me.vertexUv1s=c.has(1),Me.vertexUv2s=c.has(2),Me.vertexUv3s=c.has(3),c.clear(),Me}function m(y){let T=[];if(y.shaderID?T.push(y.shaderID):(T.push(y.customVertexShaderID),T.push(y.customFragmentShaderID)),y.defines!==void 0)for(let P in y.defines)T.push(P),T.push(y.defines[P]);return y.isRawShaderMaterial===!1&&(p(T,y),x(T,y),T.push(i.outputColorSpace)),T.push(y.customProgramCacheKey),T.join()}function p(y,T){y.push(T.precision),y.push(T.outputColorSpace),y.push(T.envMapMode),y.push(T.envMapCubeUVHeight),y.push(T.mapUv),y.push(T.alphaMapUv),y.push(T.lightMapUv),y.push(T.aoMapUv),y.push(T.bumpMapUv),y.push(T.normalMapUv),y.push(T.displacementMapUv),y.push(T.emissiveMapUv),y.push(T.metalnessMapUv),y.push(T.roughnessMapUv),y.push(T.anisotropyMapUv),y.push(T.clearcoatMapUv),y.push(T.clearcoatNormalMapUv),y.push(T.clearcoatRoughnessMapUv),y.push(T.iridescenceMapUv),y.push(T.iridescenceThicknessMapUv),y.push(T.sheenColorMapUv),y.push(T.sheenRoughnessMapUv),y.push(T.specularMapUv),y.push(T.specularColorMapUv),y.push(T.specularIntensityMapUv),y.push(T.transmissionMapUv),y.push(T.thicknessMapUv),y.push(T.combine),y.push(T.fogExp2),y.push(T.sizeAttenuation),y.push(T.morphTargetsCount),y.push(T.morphAttributeCount),y.push(T.numSunLights),y.push(T.numDirLights),y.push(T.numPointLights),y.push(T.numSpotLights),y.push(T.numSpotLightMaps),y.push(T.numHemiLights),y.push(T.numRectAreaLights),y.push(T.numSunLightShadows),y.push(T.numDirLightShadows),y.push(T.numPointLightShadows),y.push(T.numSpotLightShadows),y.push(T.numSpotLightShadowsWithMaps),y.push(T.numLightProbes),y.push(T.shadowMapType),y.push(T.toneMapping),y.push(T.numClippingPlanes),y.push(T.numClipIntersection),y.push(T.depthPacking)}function x(y,T){o.disableAll(),T.instancing&&o.enable(0),T.instancingColor&&o.enable(1),T.instancingMorph&&o.enable(2),T.matcap&&o.enable(3),T.envMap&&o.enable(4),T.normalMapObjectSpace&&o.enable(5),T.normalMapTangentSpace&&o.enable(6),T.clearcoat&&o.enable(7),T.iridescence&&o.enable(8),T.alphaTest&&o.enable(9),T.vertexColors&&o.enable(10),T.vertexAlphas&&o.enable(11),T.vertexUv1s&&o.enable(12),T.vertexUv2s&&o.enable(13),T.vertexUv3s&&o.enable(14),T.vertexTangents&&o.enable(15),T.anisotropy&&o.enable(16),T.alphaHash&&o.enable(17),T.batching&&o.enable(18),T.dispersion&&o.enable(19),T.retroreflection&&o.enable(24),T.batchingColor&&o.enable(20),T.gradientMap&&o.enable(21),T.packedNormalMap&&o.enable(22),T.vertexNormals&&o.enable(23),y.push(o.mask),o.disableAll(),T.fog&&o.enable(0),T.useFog&&o.enable(1),T.flatShading&&o.enable(2),T.logarithmicDepthBuffer&&o.enable(3),T.reversedDepthBuffer&&o.enable(4),T.skinning&&o.enable(5),T.morphTargets&&o.enable(6),T.morphNormals&&o.enable(7),T.morphColors&&o.enable(8),T.premultipliedAlpha&&o.enable(9),T.shadowMapEnabled&&o.enable(10),T.doubleSided&&o.enable(11),T.flipSided&&o.enable(12),T.useDepthPacking&&o.enable(13),T.dithering&&o.enable(14),T.transmission&&o.enable(15),T.sheen&&o.enable(16),T.opaque&&o.enable(17),T.pointsUvs&&o.enable(18),T.decodeVideoTexture&&o.enable(19),T.decodeVideoTextureEmissive&&o.enable(20),T.alphaToCoverage&&o.enable(21),T.numLightProbeGrids>0&&o.enable(22),T.hasPositionAttribute&&o.enable(23),y.push(o.mask)}function R(y){let T=f[y.type],P;if(T){let I=Tn[T];P=Mu.clone(I.uniforms)}else P=y.uniforms;return P}function S(y,T){let P=h.get(T);return P!==void 0?++P.usedTimes:(P=new D_(i,T,y,s),l.push(P),h.set(T,P)),P}function M(y){if(--y.usedTimes===0){let T=l.indexOf(y);l[T]=l[l.length-1],l.pop(),h.delete(y.cacheKey),y.destroy()}}function w(y){a.remove(y)}function E(){a.dispose()}return{getParameters:b,getProgramCacheKey:m,getUniforms:R,acquireProgram:S,releaseProgram:M,releaseShaderCache:w,programs:l,dispose:E}}function O_(){let i=new WeakMap;function e(o){return i.has(o)}function t(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,c){i.get(o)[a]=c}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function B_(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.materialVariant!==e.materialVariant?i.materialVariant-e.materialVariant:i.z!==e.z?i.z-e.z:i.id-e.id}function Hu(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function Wu(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function o(u){let f=0;return u.isInstancedMesh&&(f+=2),u.isSkinnedMesh&&(f+=1),f}function a(u,f,g,b,m,p){let x=i[e];return x===void 0?(x={id:u.id,object:u,geometry:f,material:g,materialVariant:o(u),groupOrder:b,renderOrder:u.renderOrder,z:m,group:p},i[e]=x):(x.id=u.id,x.object=u,x.geometry=f,x.material=g,x.materialVariant=o(u),x.groupOrder=b,x.renderOrder=u.renderOrder,x.z=m,x.group=p),e++,x}function c(u,f,g,b,m,p,x){x.reversedDepth===!0&&(m=-m);let R=a(u,f,g,b,m,p);g.transmission>0?n.push(R):g.transparent===!0?s.push(R):t.push(R)}function l(u,f,g,b,m,p){let x=a(u,f,g,b,m,p);g.transmission>0?n.unshift(x):g.transparent===!0?s.unshift(x):t.unshift(x)}function h(u,f){t.length>1&&t.sort(u||B_),n.length>1&&n.sort(f||Hu),s.length>1&&s.sort(f||Hu)}function d(){for(let u=e,f=i.length;u<f;u++){let g=i[u];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:c,unshift:l,finish:d,sort:h}}function z_(){let i=new WeakMap;function e(n,s){let r=i.get(n),o;return r===void 0?(o=new Wu,i.set(n,[o])):s>=r.length?(o=new Wu,r.push(o)):o=r[s],o}function t(){i=new WeakMap}return{get:e,dispose:t}}function V_(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new G,color:new Fe};break;case"SpotLight":t={position:new G,direction:new G,color:new Fe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new G,color:new Fe,distance:0,decay:0};break;case"HemisphereLight":t={direction:new G,skyColor:new Fe,groundColor:new Fe};break;case"RectAreaLight":t={color:new Fe,position:new G,halfWidth:new G,halfHeight:new G};break}return i[e.id]=t,t}}}function G_(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new We};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new We};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new We,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var H_=0;function W_(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function X_(i){let e=new V_,t=G_(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new G);let s=new G,r=new ct,o=new ct;function a(l){let h=0,d=0,u=0;for(let k=0;k<9;k++)n.probe[k].set(0,0,0);let f=0,g=0,b=0,m=0,p=0,x=0,R=0,S=0,M=0,w=0,E=0,y=0,T=0,P=0;l.sort(W_);for(let k=0,L=l.length;k<L;k++){let C=l[k],F=C.color,H=C.intensity,V=C.distance,q=null;if(C.shadow&&C.shadow.map&&(C.shadow.map.texture.format===oi?q=C.shadow.map.texture:q=C.shadow.map.depthTexture||C.shadow.map.texture),C.isAmbientLight)h+=F.r*H,d+=F.g*H,u+=F.b*H;else if(C.isLightProbe){for(let X=0;X<9;X++)n.probe[X].addScaledVector(C.sh.coefficients[X],H);P++}else if(C.isSunLight){let X=e.get(C);if(X.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){let K=C.shadow,Z=t.get(C);Z.shadowIntensity=K.intensity,Z.shadowBias=K.bias,Z.shadowNormalBias=K.normalBias,Z.shadowRadius=K.radius,Z.shadowMapSize.copy(K.mapSize).multiply(K.getFrameExtents()),n.sunShadow[g]=Z,n.sunShadowMap[g]=q;let be=K.getViewportCount();for(let ve=0;ve<be;ve++)n.sunShadowMatrix[b+ve]=K.getMatrix(ve),n.sunShadowCascade[b+ve]=K._cascadeData[ve];b+=be,g++}n.sun[f]=X,f++}else if(C.isDirectionalLight){let X=e.get(C);if(X.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){let K=C.shadow,Z=t.get(C);Z.shadowIntensity=K.intensity,Z.shadowBias=K.bias,Z.shadowNormalBias=K.normalBias,Z.shadowRadius=K.radius,Z.shadowMapSize=K.mapSize,n.directionalShadow[m]=Z,n.directionalShadowMap[m]=q,n.directionalShadowMatrix[m]=C.shadow.matrix,M++}n.directional[m]=X,m++}else if(C.isSpotLight){let X=e.get(C);X.position.setFromMatrixPosition(C.matrixWorld),X.color.copy(F).multiplyScalar(H),X.distance=V,X.coneCos=Math.cos(C.angle),X.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),X.decay=C.decay,n.spot[x]=X;let K=C.shadow;if(C.map&&(n.spotLightMap[y]=C.map,y++,K.updateMatrices(C),C.castShadow&&T++),n.spotLightMatrix[x]=K.matrix,C.castShadow){let Z=t.get(C);Z.shadowIntensity=K.intensity,Z.shadowBias=K.bias,Z.shadowNormalBias=K.normalBias,Z.shadowRadius=K.radius,Z.shadowMapSize=K.mapSize,n.spotShadow[x]=Z,n.spotShadowMap[x]=q,E++}x++}else if(C.isRectAreaLight){let X=e.get(C);X.color.copy(F).multiplyScalar(H),X.halfWidth.set(C.width*.5,0,0),X.halfHeight.set(0,C.height*.5,0),n.rectArea[R]=X,R++}else if(C.isPointLight){let X=e.get(C);if(X.color.copy(C.color).multiplyScalar(C.intensity),X.distance=C.distance,X.decay=C.decay,C.castShadow){let K=C.shadow,Z=t.get(C);Z.shadowIntensity=K.intensity,Z.shadowBias=K.bias,Z.shadowNormalBias=K.normalBias,Z.shadowRadius=K.radius,Z.shadowMapSize=K.mapSize,Z.shadowCameraNear=K.camera.near,Z.shadowCameraFar=K.camera.far,n.pointShadow[p]=Z,n.pointShadowMap[p]=q,n.pointShadowMatrix[p]=C.shadow.matrix,w++}n.point[p]=X,p++}else if(C.isHemisphereLight){let X=e.get(C);X.skyColor.copy(C.color).multiplyScalar(H),X.groundColor.copy(C.groundColor).multiplyScalar(H),n.hemi[S]=X,S++}}R>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=he.LTC_FLOAT_1,n.rectAreaLTC2=he.LTC_FLOAT_2):(n.rectAreaLTC1=he.LTC_HALF_1,n.rectAreaLTC2=he.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=d,n.ambient[2]=u;let I=n.hash;(I.sunLength!==f||I.directionalLength!==m||I.pointLength!==p||I.spotLength!==x||I.rectAreaLength!==R||I.hemiLength!==S||I.numSunShadows!==g||I.numDirectionalShadows!==M||I.numPointShadows!==w||I.numSpotShadows!==E||I.numSpotMaps!==y||I.numLightProbes!==P)&&(n.sun.length=f,n.directional.length=m,n.spot.length=x,n.rectArea.length=R,n.point.length=p,n.hemi.length=S,n.sunShadow.length=g,n.sunShadowMap.length=g,n.sunShadowMatrix.length=b,n.sunShadowCascade.length=b,n.directionalShadow.length=M,n.directionalShadowMap.length=M,n.directionalShadowMatrix.length=M,n.pointShadow.length=w,n.pointShadowMap.length=w,n.pointShadowMatrix.length=w,n.spotShadow.length=E,n.spotShadowMap.length=E,n.spotLightMatrix.length=E+y-T,n.spotLightMap.length=y,n.numSpotLightShadowsWithMaps=T,n.numLightProbes=P,I.sunLength=f,I.directionalLength=m,I.pointLength=p,I.spotLength=x,I.rectAreaLength=R,I.hemiLength=S,I.numSunShadows=g,I.numDirectionalShadows=M,I.numPointShadows=w,I.numSpotShadows=E,I.numSpotMaps=y,I.numLightProbes=P,n.version=H_++)}function c(l,h){let d=0,u=0,f=0,g=0,b=0,m=0,p=h.matrixWorldInverse;for(let x=0,R=l.length;x<R;x++){let S=l[x];if(S.isSunLight){let M=n.sun[d];M.direction.setFromMatrixPosition(S.matrixWorld),M.direction.transformDirection(p),d++}else if(S.isDirectionalLight){let M=n.directional[u];M.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),M.direction.sub(s),M.direction.transformDirection(p),u++}else if(S.isSpotLight){let M=n.spot[g];M.position.setFromMatrixPosition(S.matrixWorld),M.position.applyMatrix4(p),M.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),M.direction.sub(s),M.direction.transformDirection(p),g++}else if(S.isRectAreaLight){let M=n.rectArea[b];M.position.setFromMatrixPosition(S.matrixWorld),M.position.applyMatrix4(p),o.identity(),r.copy(S.matrixWorld),r.premultiply(p),o.extractRotation(r),M.halfWidth.set(S.width*.5,0,0),M.halfHeight.set(0,S.height*.5,0),M.halfWidth.applyMatrix4(o),M.halfHeight.applyMatrix4(o),b++}else if(S.isPointLight){let M=n.point[f];M.position.setFromMatrixPosition(S.matrixWorld),M.position.applyMatrix4(p),f++}else if(S.isHemisphereLight){let M=n.hemi[m];M.direction.setFromMatrixPosition(S.matrixWorld),M.direction.transformDirection(p),m++}}}return{setup:a,setupView:c,state:n}}function Xu(i){let e=new X_(i),t=[],n=[],s=[];function r(u){d.camera=u,t.length=0,n.length=0,s.length=0}function o(u){t.push(u)}function a(u){n.push(u)}function c(u){s.push(u)}function l(){e.setup(t)}function h(u){e.setupView(t,u)}let d={lightsArray:t,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:d,setupLights:l,setupLightsView:h,pushLight:o,pushShadow:a,pushLightProbeGrid:c}}function $_(i){let e=new WeakMap;function t(s,r=0){let o=e.get(s),a;return o===void 0?(a=new Xu(i),e.set(s,[a])):r>=o.length?(a=new Xu(i),o.push(a)):a=o[r],a}function n(){e=new WeakMap}return{get:t,dispose:n}}var j_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,q_=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Y_=[new G(1,0,0),new G(-1,0,0),new G(0,1,0),new G(0,-1,0),new G(0,0,1),new G(0,0,-1)],J_=[new G(0,-1,0),new G(0,-1,0),new G(0,0,1),new G(0,0,-1),new G(0,-1,0),new G(0,-1,0)],$u=new ct,nr=new G,cl=new G;function K_(i,e,t){let n=new Qi,s=new We,r=new We,o=new ht,a=new fo,c=new po,l={},h=t.maxTextureSize,d={[Sn]:Ot,[Ot]:Sn,[en]:en},u=new Yt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new We},radius:{value:4}},vertexShader:j_,fragmentShader:q_}),f=u.clone();f.defines.HORIZONTAL_PASS=1;let g=new Wt;g.setAttribute("position",new Ft(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let b=new Xt(g,u),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Xs;let p=this.type;this.render=function(w,E,y){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||w.length===0)return;this.type===zh&&(Ce("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Xs);let T=i.getRenderTarget(),P=i.getActiveCubeFace(),I=i.getActiveMipmapLevel(),k=i.state;k.setBlending(Mn),k.buffers.depth.getReversed()===!0?k.buffers.color.setClear(0,0,0,0):k.buffers.color.setClear(1,1,1,1),k.buffers.depth.setTest(!0),k.setScissorTest(!1);let L=p!==this.type;L&&E.traverse(function(C){C.material&&(Array.isArray(C.material)?C.material.forEach(F=>F.needsUpdate=!0):C.material.needsUpdate=!0)});for(let C=0,F=w.length;C<F;C++){let H=w[C],V=H.shadow;if(V===void 0){Ce("WebGLShadowMap:",H,"has no shadow.");continue}if(V.autoUpdate===!1&&V.needsUpdate===!1)continue;s.copy(V.mapSize);let q=V.getFrameExtents();s.multiply(q),r.copy(V.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/q.x),s.x=r.x*q.x,V.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/q.y),s.y=r.y*q.y,V.mapSize.y=r.y));let X=i.state.buffers.depth.getReversed();if(V.camera._reversedDepth=X,V.map===null||L===!0){if(V.map!==null&&(V.map.depthTexture!==null&&(V.map.depthTexture.dispose(),V.map.depthTexture=null),V.map.dispose()),this.type===ts){if(H.isPointLight){Ce("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}V.map=new Ht(s.x,s.y,{format:oi,type:dn,minFilter:Tt,magFilter:Tt,generateMipmaps:!1}),V.map.texture.name=H.name+".shadowMap",V.map.depthTexture=new Zn(s.x,s.y,un),V.map.depthTexture.name=H.name+".shadowMapDepth",V.map.depthTexture.format=xn,V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=St,V.map.depthTexture.magFilter=St}else H.isPointLight?(V.map=new xa(s.x),V.map.depthTexture=new ho(s.x,hn)):(V.map=new Ht(s.x,s.y),V.map.depthTexture=new Zn(s.x,s.y,hn)),V.map.depthTexture.name=H.name+".shadowMap",V.map.depthTexture.format=xn,this.type===Xs?(V.map.depthTexture.compareFunction=X?ma:pa,V.map.depthTexture.minFilter=Tt,V.map.depthTexture.magFilter=Tt):(V.map.depthTexture.compareFunction=null,V.map.depthTexture.minFilter=St,V.map.depthTexture.magFilter=St);V.camera.updateProjectionMatrix()}V.map.isWebGLCubeRenderTarget!==!0&&(V.map.width!==s.x||V.map.height!==s.y)&&V.map.setSize(s.x,s.y);let K=V.map.isWebGLCubeRenderTarget?6:V.getViewportCount();H.isPointLight!==!0&&V.updateMatrices(H,y);for(let Z=0;Z<K;Z++){let be=V.getCamera(Z);if(H.isPointLight){let ve=V.camera,nt=V.matrix,$e=H.distance||ve.far;$e!==ve.far&&(ve.far=$e,ve.updateProjectionMatrix()),nr.setFromMatrixPosition(H.matrixWorld),ve.position.copy(nr),cl.copy(ve.position),cl.add(Y_[Z]),ve.up.copy(J_[Z]),ve.lookAt(cl),ve.updateMatrixWorld(),nt.makeTranslation(-nr.x,-nr.y,-nr.z),$u.multiplyMatrices(ve.projectionMatrix,ve.matrixWorldInverse),V._frustum.setFromProjectionMatrix($u,ve.coordinateSystem,ve.reversedDepth)}if(V.map.isWebGLCubeRenderTarget)i.setRenderTarget(V.map,Z),i.clear();else{Z===0&&(i.setRenderTarget(V.map),i.clear());let ve=V.getViewport(Z);o.set(r.x*ve.x,r.y*ve.y,r.x*ve.z,r.y*ve.w),k.viewport(o)}n=V.getFrustum(Z),S(E,y,be,H,this.type)}V.isPointLightShadow!==!0&&this.type===ts&&x(V,y),V.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(T,P,I)};function x(w,E){let y=e.update(b);u.defines.VSM_SAMPLES!==w.blurSamples&&(u.defines.VSM_SAMPLES=w.blurSamples,f.defines.VSM_SAMPLES=w.blurSamples,u.needsUpdate=!0,f.needsUpdate=!0),w.mapPass===null?w.mapPass=new Ht(s.x,s.y,{format:oi,type:dn}):(w.mapPass.width!==w.map.width||w.mapPass.height!==w.map.height)&&w.mapPass.setSize(w.map.width,w.map.height),u.uniforms.shadow_pass.value=w.map.depthTexture,u.uniforms.resolution.value.set(w.map.width,w.map.height),u.uniforms.radius.value=w.radius,i.setRenderTarget(w.mapPass),i.clear(),i.renderBufferDirect(E,null,y,u,b,null),f.uniforms.shadow_pass.value=w.mapPass.texture,f.uniforms.resolution.value.set(w.map.width,w.map.height),f.uniforms.radius.value=w.radius,i.setRenderTarget(w.map),i.clear(),i.renderBufferDirect(E,null,y,f,b,null)}function R(w,E,y,T){let P=null,I=y.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(I!==void 0)P=I;else if(P=y.isPointLight===!0?c:a,i.localClippingEnabled&&E.clipShadows===!0&&Array.isArray(E.clippingPlanes)&&E.clippingPlanes.length!==0||E.displacementMap&&E.displacementScale!==0||E.alphaMap&&E.alphaTest>0||E.map&&E.alphaTest>0||E.alphaToCoverage===!0){let k=P.uuid,L=E.uuid,C=l[k];C===void 0&&(C={},l[k]=C);let F=C[L];F===void 0&&(F=P.clone(),C[L]=F,E.addEventListener("dispose",M)),P=F}if(P.visible=E.visible,P.wireframe=E.wireframe,T===ts?P.side=E.shadowSide!==null?E.shadowSide:E.side:P.side=E.shadowSide!==null?E.shadowSide:d[E.side],P.alphaMap=E.alphaMap,P.alphaTest=E.alphaToCoverage===!0?.5:E.alphaTest,P.map=E.map,P.clipShadows=E.clipShadows,P.clippingPlanes=E.clippingPlanes,P.clipIntersection=E.clipIntersection,P.displacementMap=E.displacementMap,P.displacementScale=E.displacementScale,P.displacementBias=E.displacementBias,P.wireframeLinewidth=E.wireframeLinewidth,P.linewidth=E.linewidth,y.isPointLight===!0&&P.isMeshDistanceMaterial===!0){let k=i.properties.get(P);k.light=y}return P}function S(w,E,y,T,P){if(w.visible===!1)return;if(w.layers.test(E.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&P===ts)&&(!w.frustumCulled||w.intersectsFrustum(n))){w.modelViewMatrix.multiplyMatrices(y.matrixWorldInverse,w.matrixWorld);let L=e.update(w),C=w.material;if(Array.isArray(C)){let F=L.groups;for(let H=0,V=F.length;H<V;H++){let q=F[H],X=C[q.materialIndex];if(X&&X.visible){let K=R(w,X,T,P);w.onBeforeShadow(i,w,E,y,L,K,q),i.renderBufferDirect(y,null,L,K,w,q),w.onAfterShadow(i,w,E,y,L,K,q)}}}else if(C.visible){let F=R(w,C,T,P);w.onBeforeShadow(i,w,E,y,L,F,null),i.renderBufferDirect(y,null,L,F,w,null),w.onAfterShadow(i,w,E,y,L,F,null)}}let k=w.children;for(let L=0,C=k.length;L<C;L++)S(k[L],E,y,T,P)}function M(w){w.target.removeEventListener("dispose",M);for(let y in l){let T=l[y],P=w.target.uuid;P in T&&(T[P].dispose(),delete T[P])}}}function Z_(i,e){function t(){let N=!1,ae=new ht,Q=null,ce=new ht(0,0,0,0);return{setMask:function(fe){Q!==fe&&!N&&(i.colorMask(fe,fe,fe,fe),Q=fe)},setLocked:function(fe){N=fe},setClear:function(fe,ne,Ee,Me,st){st===!0&&(fe*=Me,ne*=Me,Ee*=Me),ae.set(fe,ne,Ee,Me),ce.equals(ae)===!1&&(i.clearColor(fe,ne,Ee,Me),ce.copy(ae))},reset:function(){N=!1,Q=null,ce.set(-1,0,0,0)}}}function n(){let N=!1,ae=!1,Q=null,ce=null,fe=null;return{setReversed:function(ne){if(ae!==ne){let Ee=e.get("EXT_clip_control");ne?Ee.clipControlEXT(Ee.LOWER_LEFT_EXT,Ee.ZERO_TO_ONE_EXT):Ee.clipControlEXT(Ee.LOWER_LEFT_EXT,Ee.NEGATIVE_ONE_TO_ONE_EXT),ae=ne;let Me=fe;fe=null,this.setClear(Me)}},getReversed:function(){return ae},setTest:function(ne){ne?te(i.DEPTH_TEST):_e(i.DEPTH_TEST)},setMask:function(ne){Q!==ne&&!N&&(i.depthMask(ne),Q=ne)},setFunc:function(ne){if(ae&&(ne=vu[ne]),ce!==ne){switch(ne){case qr:i.depthFunc(i.NEVER);break;case Yr:i.depthFunc(i.ALWAYS);break;case Jr:i.depthFunc(i.LESS);break;case ji:i.depthFunc(i.LEQUAL);break;case Kr:i.depthFunc(i.EQUAL);break;case Zr:i.depthFunc(i.GEQUAL);break;case Qr:i.depthFunc(i.GREATER);break;case eo:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}ce=ne}},setLocked:function(ne){N=ne},setClear:function(ne){fe!==ne&&(fe=ne,ae&&(ne=1-ne),i.clearDepth(ne))},reset:function(){N=!1,Q=null,ce=null,fe=null,ae=!1}}}function s(){let N=!1,ae=null,Q=null,ce=null,fe=null,ne=null,Ee=null,Me=null,st=null;return{setTest:function(Je){N||(Je?te(i.STENCIL_TEST):_e(i.STENCIL_TEST))},setMask:function(Je){ae!==Je&&!N&&(i.stencilMask(Je),ae=Je)},setFunc:function(Je,nn,pn){(Q!==Je||ce!==nn||fe!==pn)&&(i.stencilFunc(Je,nn,pn),Q=Je,ce=nn,fe=pn)},setOp:function(Je,nn,pn){(ne!==Je||Ee!==nn||Me!==pn)&&(i.stencilOp(Je,nn,pn),ne=Je,Ee=nn,Me=pn)},setLocked:function(Je){N=Je},setClear:function(Je){st!==Je&&(i.clearStencil(Je),st=Je)},reset:function(){N=!1,ae=null,Q=null,ce=null,fe=null,ne=null,Ee=null,Me=null,st=null}}}let r=new t,o=new n,a=new s,c=new WeakMap,l=new WeakMap,h={},d={},u={},f=new WeakMap,g=[],b=null,m=!1,p=null,x=null,R=null,S=null,M=null,w=null,E=null,y=new Fe(0,0,0),T=0,P=!1,I=null,k=null,L=null,C=null,F=null,H=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),V=!1,q=0,X=i.getParameter(i.VERSION);X.indexOf("WebGL")!==-1?(q=parseFloat(/^WebGL (\d)/.exec(X)[1]),V=q>=1):X.indexOf("OpenGL ES")!==-1&&(q=parseFloat(/^OpenGL ES (\d)/.exec(X)[1]),V=q>=2);let K=null,Z={},be=i.getParameter(i.SCISSOR_BOX),ve=i.getParameter(i.VIEWPORT),nt=new ht().fromArray(be),$e=new ht().fromArray(ve);function Ye(N,ae,Q,ce){let fe=new Uint8Array(4),ne=i.createTexture();i.bindTexture(N,ne),i.texParameteri(N,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(N,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ee=0;Ee<Q;Ee++)N===i.TEXTURE_3D||N===i.TEXTURE_2D_ARRAY?i.texImage3D(ae,0,i.RGBA,1,1,ce,0,i.RGBA,i.UNSIGNED_BYTE,fe):i.texImage2D(ae+Ee,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,fe);return ne}let Y={};Y[i.TEXTURE_2D]=Ye(i.TEXTURE_2D,i.TEXTURE_2D,1),Y[i.TEXTURE_CUBE_MAP]=Ye(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Y[i.TEXTURE_2D_ARRAY]=Ye(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Y[i.TEXTURE_3D]=Ye(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),te(i.DEPTH_TEST),o.setFunc(ji),Ge(!1),lt(Cc),te(i.CULL_FACE),qe(Mn);function te(N){h[N]!==!0&&(i.enable(N),h[N]=!0)}function _e(N){h[N]!==!1&&(i.disable(N),h[N]=!1)}function ke(N,ae){return u[N]!==ae?(i.bindFramebuffer(N,ae),u[N]=ae,N===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=ae),N===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=ae),!0):!1}function me(N,ae){let Q=g,ce=!1;if(N){Q=f.get(ae),Q===void 0&&(Q=[],f.set(ae,Q));let fe=N.textures;if(Q.length!==fe.length||Q[0]!==i.COLOR_ATTACHMENT0){for(let ne=0,Ee=fe.length;ne<Ee;ne++)Q[ne]=i.COLOR_ATTACHMENT0+ne;Q.length=fe.length,ce=!0}}else Q[0]!==i.BACK&&(Q[0]=i.BACK,ce=!0);ce&&i.drawBuffers(Q)}function Be(N){return b!==N?(i.useProgram(N),b=N,!0):!1}let gt={[vi]:i.FUNC_ADD,[Gh]:i.FUNC_SUBTRACT,[Hh]:i.FUNC_REVERSE_SUBTRACT};gt[Wh]=i.MIN,gt[Xh]=i.MAX;let ze={[$h]:i.ZERO,[jh]:i.ONE,[qh]:i.SRC_COLOR,[kc]:i.SRC_ALPHA,[eu]:i.SRC_ALPHA_SATURATE,[Zh]:i.DST_COLOR,[Jh]:i.DST_ALPHA,[Yh]:i.ONE_MINUS_SRC_COLOR,[Dc]:i.ONE_MINUS_SRC_ALPHA,[Qh]:i.ONE_MINUS_DST_COLOR,[Kh]:i.ONE_MINUS_DST_ALPHA,[tu]:i.CONSTANT_COLOR,[nu]:i.ONE_MINUS_CONSTANT_COLOR,[iu]:i.CONSTANT_ALPHA,[su]:i.ONE_MINUS_CONSTANT_ALPHA};function qe(N,ae,Q,ce,fe,ne,Ee,Me,st,Je){if(N===Mn){m===!0&&(_e(i.BLEND),m=!1);return}if(m===!1&&(te(i.BLEND),m=!0),N!==Vh){if(N!==p||Je!==P){if((x!==vi||M!==vi)&&(i.blendEquation(i.FUNC_ADD),x=vi,M=vi),Je)switch(N){case ns:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Pc:i.blendFunc(i.ONE,i.ONE);break;case Ic:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Lc:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Pe("WebGLState: Invalid blending: ",N);break}else switch(N){case ns:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Pc:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Ic:Pe("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Lc:Pe("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Pe("WebGLState: Invalid blending: ",N);break}R=null,S=null,w=null,E=null,y.set(0,0,0),T=0,p=N,P=Je}return}fe=fe||ae,ne=ne||Q,Ee=Ee||ce,(ae!==x||fe!==M)&&(i.blendEquationSeparate(gt[ae],gt[fe]),x=ae,M=fe),(Q!==R||ce!==S||ne!==w||Ee!==E)&&(i.blendFuncSeparate(ze[Q],ze[ce],ze[ne],ze[Ee]),R=Q,S=ce,w=ne,E=Ee),(Me.equals(y)===!1||st!==T)&&(i.blendColor(Me.r,Me.g,Me.b,st),y.copy(Me),T=st),p=N,P=!1}function it(N,ae){N.side===en?_e(i.CULL_FACE):te(i.CULL_FACE);let Q=N.side===Ot;ae&&(Q=!Q),Ge(Q),N.blending===ns&&N.transparent===!1?qe(Mn):qe(N.blending,N.blendEquation,N.blendSrc,N.blendDst,N.blendEquationAlpha,N.blendSrcAlpha,N.blendDstAlpha,N.blendColor,N.blendAlpha,N.premultipliedAlpha),o.setFunc(N.depthFunc),o.setTest(N.depthTest),o.setMask(N.depthWrite),r.setMask(N.colorWrite);let ce=N.stencilWrite;a.setTest(ce),ce&&(a.setMask(N.stencilWriteMask),a.setFunc(N.stencilFunc,N.stencilRef,N.stencilFuncMask),a.setOp(N.stencilFail,N.stencilZFail,N.stencilZPass)),Bt(N.polygonOffset,N.polygonOffsetFactor,N.polygonOffsetUnits),N.alphaToCoverage===!0?te(i.SAMPLE_ALPHA_TO_COVERAGE):_e(i.SAMPLE_ALPHA_TO_COVERAGE)}function Ge(N){I!==N&&(N?i.frontFace(i.CW):i.frontFace(i.CCW),I=N)}function lt(N){N!==Oh?(te(i.CULL_FACE),N!==k&&(N===Cc?i.cullFace(i.BACK):N===Bh?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):_e(i.CULL_FACE),k=N}function xt(N){N!==L&&(V&&i.lineWidth(N),L=N)}function Bt(N,ae,Q){N?(te(i.POLYGON_OFFSET_FILL),(C!==ae||F!==Q)&&(C=ae,F=Q,o.getReversed()&&(ae=-ae),i.polygonOffset(ae,Q))):_e(i.POLYGON_OFFSET_FILL)}function ut(N){N?te(i.SCISSOR_TEST):_e(i.SCISSOR_TEST)}function ft(N){N===void 0&&(N=i.TEXTURE0+H-1),K!==N&&(i.activeTexture(N),K=N)}function U(N,ae,Q){Q===void 0&&(K===null?Q=i.TEXTURE0+H-1:Q=K);let ce=Z[Q];ce===void 0&&(ce={type:void 0,texture:void 0},Z[Q]=ce),(ce.type!==N||ce.texture!==ae)&&(K!==Q&&(i.activeTexture(Q),K=Q),i.bindTexture(N,ae||Y[N]),ce.type=N,ce.texture=ae)}function At(){let N=Z[K];N!==void 0&&N.type!==void 0&&(i.bindTexture(N.type,null),N.type=void 0,N.texture=void 0)}function Qe(){try{i.compressedTexImage2D(...arguments)}catch(N){Pe("WebGLState:",N)}}function A(){try{i.compressedTexImage3D(...arguments)}catch(N){Pe("WebGLState:",N)}}function _(){try{i.texSubImage2D(...arguments)}catch(N){Pe("WebGLState:",N)}}function O(){try{i.texSubImage3D(...arguments)}catch(N){Pe("WebGLState:",N)}}function W(){try{i.compressedTexSubImage2D(...arguments)}catch(N){Pe("WebGLState:",N)}}function j(){try{i.compressedTexSubImage3D(...arguments)}catch(N){Pe("WebGLState:",N)}}function ie(){try{i.texStorage2D(...arguments)}catch(N){Pe("WebGLState:",N)}}function se(){try{i.texStorage3D(...arguments)}catch(N){Pe("WebGLState:",N)}}function J(){try{i.texImage2D(...arguments)}catch(N){Pe("WebGLState:",N)}}function ee(){try{i.texImage3D(...arguments)}catch(N){Pe("WebGLState:",N)}}function re(N){return d[N]!==void 0?d[N]:i.getParameter(N)}function Te(N,ae){d[N]!==ae&&(i.pixelStorei(N,ae),d[N]=ae)}function le(N){nt.equals(N)===!1&&(i.scissor(N.x,N.y,N.z,N.w),nt.copy(N))}function oe(N){$e.equals(N)===!1&&(i.viewport(N.x,N.y,N.z,N.w),$e.copy(N))}function Ae(N,ae){let Q=l.get(ae);Q===void 0&&(Q=new WeakMap,l.set(ae,Q));let ce=Q.get(N);ce===void 0&&(ce=i.getUniformBlockIndex(ae,N.name),Q.set(N,ce))}function Re(N,ae){let ce=l.get(ae).get(N);c.get(ae)!==ce&&(i.uniformBlockBinding(ae,ce,N.__bindingPointIndex),c.set(ae,ce))}function De(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),h={},d={},K=null,Z={},u={},f=new WeakMap,g=[],b=null,m=!1,p=null,x=null,R=null,S=null,M=null,w=null,E=null,y=new Fe(0,0,0),T=0,P=!1,I=null,k=null,L=null,C=null,F=null,nt.set(0,0,i.canvas.width,i.canvas.height),$e.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:te,disable:_e,bindFramebuffer:ke,drawBuffers:me,useProgram:Be,setBlending:qe,setMaterial:it,setFlipSided:Ge,setCullFace:lt,setLineWidth:xt,setPolygonOffset:Bt,setScissorTest:ut,activeTexture:ft,bindTexture:U,unbindTexture:At,compressedTexImage2D:Qe,compressedTexImage3D:A,texImage2D:J,texImage3D:ee,pixelStorei:Te,getParameter:re,updateUBOMapping:Ae,uniformBlockBinding:Re,texStorage2D:ie,texStorage3D:se,texSubImage2D:_,texSubImage3D:O,compressedTexSubImage2D:W,compressedTexSubImage3D:j,scissor:le,viewport:oe,reset:De}}function Q_(i,e,t,n,s,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new We,h=new WeakMap,d=new Set,u,f=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function b(A,_){return g?new OffscreenCanvas(A,_):Rs("canvas")}function m(A,_,O){let W=1,j=Qe(A);if((j.width>O||j.height>O)&&(W=O/Math.max(j.width,j.height)),W<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){let ie=Math.floor(W*j.width),se=Math.floor(W*j.height);u===void 0&&(u=b(ie,se));let J=_?b(ie,se):u;return J.width=ie,J.height=se,J.getContext("2d").drawImage(A,0,0,ie,se),Ce("WebGLRenderer: Texture has been resized from ("+j.width+"x"+j.height+") to ("+ie+"x"+se+")."),J}else return"data"in A&&Ce("WebGLRenderer: Image in DataTexture is too big ("+j.width+"x"+j.height+")."),A;return A}function p(A){return A.generateMipmaps}function x(A){i.generateMipmap(A)}function R(A){return A.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?i.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function S(A,_,O,W,j,ie=!1){if(A!==null){if(i[A]!==void 0)return i[A];Ce("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let se;W&&(se=e.get("EXT_texture_norm16"),se||Ce("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let J=_;if(_===i.RED&&(O===i.FLOAT&&(J=i.R32F),O===i.HALF_FLOAT&&(J=i.R16F),O===i.UNSIGNED_BYTE&&(J=i.R8),O===i.UNSIGNED_SHORT&&se&&(J=se.R16_EXT),O===i.SHORT&&se&&(J=se.R16_SNORM_EXT)),_===i.RED_INTEGER&&(O===i.UNSIGNED_BYTE&&(J=i.R8UI),O===i.UNSIGNED_SHORT&&(J=i.R16UI),O===i.UNSIGNED_INT&&(J=i.R32UI),O===i.BYTE&&(J=i.R8I),O===i.SHORT&&(J=i.R16I),O===i.INT&&(J=i.R32I)),_===i.RG&&(O===i.FLOAT&&(J=i.RG32F),O===i.HALF_FLOAT&&(J=i.RG16F),O===i.UNSIGNED_BYTE&&(J=i.RG8),O===i.UNSIGNED_SHORT&&se&&(J=se.RG16_EXT),O===i.SHORT&&se&&(J=se.RG16_SNORM_EXT)),_===i.RG_INTEGER&&(O===i.UNSIGNED_BYTE&&(J=i.RG8UI),O===i.UNSIGNED_SHORT&&(J=i.RG16UI),O===i.UNSIGNED_INT&&(J=i.RG32UI),O===i.BYTE&&(J=i.RG8I),O===i.SHORT&&(J=i.RG16I),O===i.INT&&(J=i.RG32I)),_===i.RGB_INTEGER&&(O===i.UNSIGNED_BYTE&&(J=i.RGB8UI),O===i.UNSIGNED_SHORT&&(J=i.RGB16UI),O===i.UNSIGNED_INT&&(J=i.RGB32UI),O===i.BYTE&&(J=i.RGB8I),O===i.SHORT&&(J=i.RGB16I),O===i.INT&&(J=i.RGB32I)),_===i.RGBA_INTEGER&&(O===i.UNSIGNED_BYTE&&(J=i.RGBA8UI),O===i.UNSIGNED_SHORT&&(J=i.RGBA16UI),O===i.UNSIGNED_INT&&(J=i.RGBA32UI),O===i.BYTE&&(J=i.RGBA8I),O===i.SHORT&&(J=i.RGBA16I),O===i.INT&&(J=i.RGBA32I)),_===i.RGB&&(O===i.UNSIGNED_SHORT&&se&&(J=se.RGB16_EXT),O===i.SHORT&&se&&(J=se.RGB16_SNORM_EXT),O===i.UNSIGNED_INT_5_9_9_9_REV&&(J=i.RGB9_E5),O===i.UNSIGNED_INT_10F_11F_11F_REV&&(J=i.R11F_G11F_B10F)),_===i.RGBA){let ee=ie?Es:He.getTransfer(j);O===i.FLOAT&&(J=i.RGBA32F),O===i.HALF_FLOAT&&(J=i.RGBA16F),O===i.UNSIGNED_BYTE&&(J=ee===Ze?i.SRGB8_ALPHA8:i.RGBA8),O===i.UNSIGNED_SHORT&&se&&(J=se.RGBA16_EXT),O===i.SHORT&&se&&(J=se.RGBA16_SNORM_EXT),O===i.UNSIGNED_SHORT_4_4_4_4&&(J=i.RGBA4),O===i.UNSIGNED_SHORT_5_5_5_1&&(J=i.RGB5_A1)}return(J===i.R16F||J===i.R32F||J===i.RG16F||J===i.RG32F||J===i.RGBA16F||J===i.RGBA32F)&&e.get("EXT_color_buffer_float"),J}function M(A,_){let O;return A?_===null||_===hn||_===ss?O=i.DEPTH24_STENCIL8:_===un?O=i.DEPTH32F_STENCIL8:_===is&&(O=i.DEPTH24_STENCIL8,Ce("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===hn||_===ss?O=i.DEPTH_COMPONENT24:_===un?O=i.DEPTH_COMPONENT32F:_===is&&(O=i.DEPTH_COMPONENT16),O}function w(A,_){return p(A)===!0||A.isFramebufferTexture&&A.minFilter!==St&&A.minFilter!==Tt?Math.log2(Math.max(_.width,_.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?_.mipmaps.length:1}function E(A){let _=A.target;_.removeEventListener("dispose",E),T(_),_.isVideoTexture&&h.delete(_),_.isHTMLTexture&&d.delete(_)}function y(A){let _=A.target;_.removeEventListener("dispose",y),I(_)}function T(A){let _=n.get(A);if(_.__webglInit===void 0)return;let O=A.source,W=f.get(O);if(W){let j=W[_.__cacheKey];j.usedTimes--,j.usedTimes===0&&P(A),Object.keys(W).length===0&&f.delete(O)}n.remove(A)}function P(A){let _=n.get(A);i.deleteTexture(_.__webglTexture);let O=A.source,W=f.get(O);delete W[_.__cacheKey],o.memory.textures--}function I(A){let _=n.get(A);if(A.depthTexture&&(A.depthTexture.dispose(),n.remove(A.depthTexture)),A.isWebGLCubeRenderTarget)for(let W=0;W<6;W++){if(Array.isArray(_.__webglFramebuffer[W]))for(let j=0;j<_.__webglFramebuffer[W].length;j++)i.deleteFramebuffer(_.__webglFramebuffer[W][j]);else i.deleteFramebuffer(_.__webglFramebuffer[W]);_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer[W])}else{if(Array.isArray(_.__webglFramebuffer))for(let W=0;W<_.__webglFramebuffer.length;W++)i.deleteFramebuffer(_.__webglFramebuffer[W]);else i.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&i.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let W=0;W<_.__webglColorRenderbuffer.length;W++)_.__webglColorRenderbuffer[W]&&i.deleteRenderbuffer(_.__webglColorRenderbuffer[W]);_.__webglDepthRenderbuffer&&i.deleteRenderbuffer(_.__webglDepthRenderbuffer)}let O=A.textures;for(let W=0,j=O.length;W<j;W++){let ie=n.get(O[W]);ie.__webglTexture&&(i.deleteTexture(ie.__webglTexture),o.memory.textures--),n.remove(O[W])}n.remove(A)}let k=0;function L(){k=0}function C(){return k}function F(A){k=A}function H(){let A=k;return A>=s.maxTextures&&Ce("WebGLTextures: Trying to use "+(A+1)+" texture units while this GPU supports only "+s.maxTextures),k+=1,A}function V(A){let _=[];return _.push(A.wrapS),_.push(A.wrapT),_.push(A.wrapR||0),_.push(A.magFilter),_.push(A.minFilter),_.push(A.anisotropy),_.push(A.internalFormat),_.push(A.format),_.push(A.type),_.push(A.generateMipmaps),_.push(A.premultiplyAlpha),_.push(A.flipY),_.push(A.unpackAlignment),_.push(A.colorSpace),_.join()}function q(A,_){let O=n.get(A);if(A.isVideoTexture&&U(A),A.isRenderTargetTexture===!1&&A.isExternalTexture!==!0&&A.version>0&&O.__version!==A.version){let W=A.image;if(W===null)Ce("WebGLRenderer: Texture marked for update but no image data found.");else if(W.complete===!1)Ce("WebGLRenderer: Texture marked for update but image is incomplete");else{_e(O,A,_);return}}else A.isExternalTexture&&(O.__webglTexture=A.sourceTexture?A.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,O.__webglTexture,i.TEXTURE0+_)}function X(A,_){let O=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&O.__version!==A.version){_e(O,A,_);return}else A.isExternalTexture&&(O.__webglTexture=A.sourceTexture?A.sourceTexture:null);t.bindTexture(i.TEXTURE_2D_ARRAY,O.__webglTexture,i.TEXTURE0+_)}function K(A,_){let O=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&O.__version!==A.version){_e(O,A,_);return}t.bindTexture(i.TEXTURE_3D,O.__webglTexture,i.TEXTURE0+_)}function Z(A,_){let O=n.get(A);if(A.isCubeDepthTexture!==!0&&A.version>0&&O.__version!==A.version){ke(O,A,_);return}t.bindTexture(i.TEXTURE_CUBE_MAP,O.__webglTexture,i.TEXTURE0+_)}let be={[to]:i.REPEAT,[_n]:i.CLAMP_TO_EDGE,[no]:i.MIRRORED_REPEAT},ve={[St]:i.NEAREST,[au]:i.NEAREST_MIPMAP_NEAREST,[js]:i.NEAREST_MIPMAP_LINEAR,[Tt]:i.LINEAR,[Po]:i.LINEAR_MIPMAP_NEAREST,[si]:i.LINEAR_MIPMAP_LINEAR},nt={[uu]:i.NEVER,[gu]:i.ALWAYS,[du]:i.LESS,[pa]:i.LEQUAL,[fu]:i.EQUAL,[ma]:i.GEQUAL,[pu]:i.GREATER,[mu]:i.NOTEQUAL};function $e(A,_){if(_.type===un&&e.has("OES_texture_float_linear")===!1&&(_.magFilter===Tt||_.magFilter===Po||_.magFilter===js||_.magFilter===si||_.minFilter===Tt||_.minFilter===Po||_.minFilter===js||_.minFilter===si)&&Ce("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(A,i.TEXTURE_WRAP_S,be[_.wrapS]),i.texParameteri(A,i.TEXTURE_WRAP_T,be[_.wrapT]),(A===i.TEXTURE_3D||A===i.TEXTURE_2D_ARRAY)&&i.texParameteri(A,i.TEXTURE_WRAP_R,be[_.wrapR]),i.texParameteri(A,i.TEXTURE_MAG_FILTER,ve[_.magFilter]),i.texParameteri(A,i.TEXTURE_MIN_FILTER,ve[_.minFilter]),_.compareFunction&&(i.texParameteri(A,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(A,i.TEXTURE_COMPARE_FUNC,nt[_.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===St||_.minFilter!==js&&_.minFilter!==si||_.type===un&&e.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||n.get(_).__currentAnisotropy){let O=e.get("EXT_texture_filter_anisotropic");i.texParameterf(A,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,s.getMaxAnisotropy())),n.get(_).__currentAnisotropy=_.anisotropy}}}function Ye(A,_){let O=!1;A.__webglInit===void 0&&(A.__webglInit=!0,_.addEventListener("dispose",E));let W=_.source,j=f.get(W);j===void 0&&(j={},f.set(W,j));let ie=V(_);if(ie!==A.__cacheKey){j[ie]===void 0&&(j[ie]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,O=!0),j[ie].usedTimes++;let se=j[A.__cacheKey];se!==void 0&&(j[A.__cacheKey].usedTimes--,se.usedTimes===0&&P(_)),A.__cacheKey=ie,A.__webglTexture=j[ie].texture}return O}function Y(A,_,O){return Math.floor(Math.floor(A/O)/_)}function te(A,_,O,W){let ie=A.updateRanges;if(ie.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,_.width,_.height,O,W,_.data);else{ie.sort((Te,le)=>Te.start-le.start);let se=0;for(let Te=1;Te<ie.length;Te++){let le=ie[se],oe=ie[Te],Ae=le.start+le.count,Re=Y(oe.start,_.width,4),De=Y(le.start,_.width,4);oe.start<=Ae+1&&Re===De&&Y(oe.start+oe.count-1,_.width,4)===Re?le.count=Math.max(le.count,oe.start+oe.count-le.start):(++se,ie[se]=oe)}ie.length=se+1;let J=t.getParameter(i.UNPACK_ROW_LENGTH),ee=t.getParameter(i.UNPACK_SKIP_PIXELS),re=t.getParameter(i.UNPACK_SKIP_ROWS);t.pixelStorei(i.UNPACK_ROW_LENGTH,_.width);for(let Te=0,le=ie.length;Te<le;Te++){let oe=ie[Te],Ae=Math.floor(oe.start/4),Re=Math.ceil(oe.count/4),De=Ae%_.width,N=Math.floor(Ae/_.width),ae=Re,Q=1;t.pixelStorei(i.UNPACK_SKIP_PIXELS,De),t.pixelStorei(i.UNPACK_SKIP_ROWS,N),t.texSubImage2D(i.TEXTURE_2D,0,De,N,ae,Q,O,W,_.data)}A.clearUpdateRanges(),t.pixelStorei(i.UNPACK_ROW_LENGTH,J),t.pixelStorei(i.UNPACK_SKIP_PIXELS,ee),t.pixelStorei(i.UNPACK_SKIP_ROWS,re)}}function _e(A,_,O){let W=i.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(W=i.TEXTURE_2D_ARRAY),_.isData3DTexture&&(W=i.TEXTURE_3D);let j=Ye(A,_),ie=_.source;t.bindTexture(W,A.__webglTexture,i.TEXTURE0+O);let se=n.get(ie);if(ie.version!==se.__version||j===!0){if(t.activeTexture(i.TEXTURE0+O),(typeof ImageBitmap<"u"&&_.image instanceof ImageBitmap)===!1){let Q=He.getPrimaries(He.workingColorSpace),ce=_.colorSpace===Dn?null:He.getPrimaries(_.colorSpace),fe=_.colorSpace===Dn||Q===ce?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,fe)}t.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment);let ee=m(_.image,!1,s.maxTextureSize);ee=At(_,ee);let re=r.convert(_.format,_.colorSpace),Te=r.convert(_.type),le=S(_.internalFormat,re,Te,_.normalized,_.colorSpace,_.isVideoTexture);$e(W,_);let oe,Ae=_.mipmaps,Re=_.isVideoTexture!==!0,De=se.__version===void 0||j===!0,N=ie.dataReady,ae=w(_,ee);if(_.isDepthTexture)le=M(_.format===ri,_.type),De&&(Re?t.texStorage2D(i.TEXTURE_2D,1,le,ee.width,ee.height):t.texImage2D(i.TEXTURE_2D,0,le,ee.width,ee.height,0,re,Te,null));else if(_.isDataTexture)if(Ae.length>0){Re&&De&&t.texStorage2D(i.TEXTURE_2D,ae,le,Ae[0].width,Ae[0].height);for(let Q=0,ce=Ae.length;Q<ce;Q++)oe=Ae[Q],Re?N&&t.texSubImage2D(i.TEXTURE_2D,Q,0,0,oe.width,oe.height,re,Te,oe.data):t.texImage2D(i.TEXTURE_2D,Q,le,oe.width,oe.height,0,re,Te,oe.data);_.generateMipmaps=!1}else Re?(De&&t.texStorage2D(i.TEXTURE_2D,ae,le,ee.width,ee.height),N&&te(_,ee,re,Te)):t.texImage2D(i.TEXTURE_2D,0,le,ee.width,ee.height,0,re,Te,ee.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){Re&&De&&t.texStorage3D(i.TEXTURE_2D_ARRAY,ae,le,Ae[0].width,Ae[0].height,ee.depth);for(let Q=0,ce=Ae.length;Q<ce;Q++)if(oe=Ae[Q],_.format!==tn)if(re!==null)if(Re){if(N)if(_.layerUpdates.size>0){let fe=nl(oe.width,oe.height,_.format,_.type);for(let ne of _.layerUpdates){let Ee=oe.data.subarray(ne*fe/oe.data.BYTES_PER_ELEMENT,(ne+1)*fe/oe.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,Q,0,0,ne,oe.width,oe.height,1,re,Ee)}}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,Q,0,0,0,oe.width,oe.height,ee.depth,re,oe.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,Q,le,oe.width,oe.height,ee.depth,0,oe.data,0,0);else Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Re?N&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,Q,0,0,0,oe.width,oe.height,ee.depth,re,Te,oe.data):t.texImage3D(i.TEXTURE_2D_ARRAY,Q,le,oe.width,oe.height,ee.depth,0,re,Te,oe.data);_.layerUpdates.size>0&&_.clearLayerUpdates()}else{Re&&De&&t.texStorage2D(i.TEXTURE_2D,ae,le,Ae[0].width,Ae[0].height);for(let Q=0,ce=Ae.length;Q<ce;Q++)oe=Ae[Q],_.format!==tn?re!==null?Re?N&&t.compressedTexSubImage2D(i.TEXTURE_2D,Q,0,0,oe.width,oe.height,re,oe.data):t.compressedTexImage2D(i.TEXTURE_2D,Q,le,oe.width,oe.height,0,oe.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Re?N&&t.texSubImage2D(i.TEXTURE_2D,Q,0,0,oe.width,oe.height,re,Te,oe.data):t.texImage2D(i.TEXTURE_2D,Q,le,oe.width,oe.height,0,re,Te,oe.data)}else if(_.isDataArrayTexture)if(Re){if(De&&t.texStorage3D(i.TEXTURE_2D_ARRAY,ae,le,ee.width,ee.height,ee.depth),N)if(_.layerUpdates.size>0){let Q=nl(ee.width,ee.height,_.format,_.type);for(let ce of _.layerUpdates){let fe=ee.data.subarray(ce*Q/ee.data.BYTES_PER_ELEMENT,(ce+1)*Q/ee.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,ce,ee.width,ee.height,1,re,Te,fe)}_.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,ee.width,ee.height,ee.depth,re,Te,ee.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,le,ee.width,ee.height,ee.depth,0,re,Te,ee.data);else if(_.isData3DTexture)Re?(De&&t.texStorage3D(i.TEXTURE_3D,ae,le,ee.width,ee.height,ee.depth),N&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,ee.width,ee.height,ee.depth,re,Te,ee.data)):t.texImage3D(i.TEXTURE_3D,0,le,ee.width,ee.height,ee.depth,0,re,Te,ee.data);else if(_.isFramebufferTexture){if(De)if(Re)t.texStorage2D(i.TEXTURE_2D,ae,le,ee.width,ee.height);else{let Q=ee.width,ce=ee.height;for(let fe=0;fe<ae;fe++)t.texImage2D(i.TEXTURE_2D,fe,le,Q,ce,0,re,Te,null),Q>>=1,ce>>=1}}else if(_.isHTMLTexture){if("texElementImage2D"in i){let Q=i.canvas;if(Q.hasAttribute("layoutsubtree")||Q.setAttribute("layoutsubtree","true"),ee.parentNode!==Q){Q.appendChild(ee),d.add(_),Q.onpaint=ce=>{let fe=ce.changedElements;for(let ne of d)fe.includes(ne.image)&&(ne.needsUpdate=!0)},Q.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,ee);else{let fe=i.RGBA,ne=i.RGBA,Ee=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,fe,ne,Ee,ee)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(Ae.length>0){if(Re&&De){let Q=Qe(Ae[0]);t.texStorage2D(i.TEXTURE_2D,ae,le,Q.width,Q.height)}for(let Q=0,ce=Ae.length;Q<ce;Q++)oe=Ae[Q],Re?N&&t.texSubImage2D(i.TEXTURE_2D,Q,0,0,re,Te,oe):t.texImage2D(i.TEXTURE_2D,Q,le,re,Te,oe);_.generateMipmaps=!1}else if(Re){if(De){let Q=Qe(ee);t.texStorage2D(i.TEXTURE_2D,ae,le,Q.width,Q.height)}N&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,re,Te,ee)}else t.texImage2D(i.TEXTURE_2D,0,le,re,Te,ee);p(_)&&x(W),se.__version=ie.version,_.onUpdate&&_.onUpdate(_)}A.__version=_.version}function ke(A,_,O){if(_.image.length!==6)return;let W=Ye(A,_),j=_.source;t.bindTexture(i.TEXTURE_CUBE_MAP,A.__webglTexture,i.TEXTURE0+O);let ie=n.get(j);if(j.version!==ie.__version||W===!0){t.activeTexture(i.TEXTURE0+O);let se=He.getPrimaries(He.workingColorSpace),J=_.colorSpace===Dn?null:He.getPrimaries(_.colorSpace),ee=_.colorSpace===Dn||se===J?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),t.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ee);let re=_.isCompressedTexture||_.image[0].isCompressedTexture,Te=_.image[0]&&_.image[0].isDataTexture,le=[];for(let ne=0;ne<6;ne++)!re&&!Te?le[ne]=m(_.image[ne],!0,s.maxCubemapSize):le[ne]=Te?_.image[ne].image:_.image[ne],le[ne]=At(_,le[ne]);let oe=le[0],Ae=r.convert(_.format,_.colorSpace),Re=r.convert(_.type),De=S(_.internalFormat,Ae,Re,_.normalized,_.colorSpace),N=_.isVideoTexture!==!0,ae=ie.__version===void 0||W===!0,Q=j.dataReady,ce=w(_,oe);$e(i.TEXTURE_CUBE_MAP,_);let fe;if(re){N&&ae&&t.texStorage2D(i.TEXTURE_CUBE_MAP,ce,De,oe.width,oe.height);for(let ne=0;ne<6;ne++){fe=le[ne].mipmaps;for(let Ee=0;Ee<fe.length;Ee++){let Me=fe[Ee];_.format!==tn?Ae!==null?N?Q&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ee,0,0,Me.width,Me.height,Ae,Me.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ee,De,Me.width,Me.height,0,Me.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):N?Q&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ee,0,0,Me.width,Me.height,Ae,Re,Me.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ee,De,Me.width,Me.height,0,Ae,Re,Me.data)}}}else{if(fe=_.mipmaps,N&&ae){fe.length>0&&ce++;let ne=Qe(le[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,ce,De,ne.width,ne.height)}for(let ne=0;ne<6;ne++)if(Te){N?Q&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,0,0,le[ne].width,le[ne].height,Ae,Re,le[ne].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,De,le[ne].width,le[ne].height,0,Ae,Re,le[ne].data);for(let Ee=0;Ee<fe.length;Ee++){let st=fe[Ee].image[ne].image;N?Q&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ee+1,0,0,st.width,st.height,Ae,Re,st.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ee+1,De,st.width,st.height,0,Ae,Re,st.data)}}else{N?Q&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,0,0,Ae,Re,le[ne]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,De,Ae,Re,le[ne]);for(let Ee=0;Ee<fe.length;Ee++){let Me=fe[Ee];N?Q&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ee+1,0,0,Ae,Re,Me.image[ne]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ee+1,De,Ae,Re,Me.image[ne])}}}p(_)&&x(i.TEXTURE_CUBE_MAP),ie.__version=j.version,_.onUpdate&&_.onUpdate(_)}A.__version=_.version}function me(A,_,O,W,j,ie){let se=r.convert(O.format,O.colorSpace),J=r.convert(O.type),ee=S(O.internalFormat,se,J,O.normalized,O.colorSpace),re=n.get(_),Te=n.get(O);if(Te.__renderTarget=_,!re.__hasExternalTextures){let le=Math.max(1,_.width>>ie),oe=Math.max(1,_.height>>ie);j===i.TEXTURE_3D||j===i.TEXTURE_2D_ARRAY?t.texImage3D(j,ie,ee,le,oe,_.depth,0,se,J,null):t.texImage2D(j,ie,ee,le,oe,0,se,J,null)}t.bindFramebuffer(i.FRAMEBUFFER,A),ft(_)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,W,j,Te.__webglTexture,0,ut(_)):(j===i.TEXTURE_2D||j>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&j<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,W,j,Te.__webglTexture,ie),t.bindFramebuffer(i.FRAMEBUFFER,null)}function Be(A,_,O){if(i.bindRenderbuffer(i.RENDERBUFFER,A),_.depthBuffer){let W=_.depthTexture,j=W&&W.isDepthTexture?W.type:null,ie=M(_.stencilBuffer,j),se=_.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;ft(_)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ut(_),ie,_.width,_.height):O?i.renderbufferStorageMultisample(i.RENDERBUFFER,ut(_),ie,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,ie,_.width,_.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,se,i.RENDERBUFFER,A)}else{let W=_.textures;for(let j=0;j<W.length;j++){let ie=W[j],se=r.convert(ie.format,ie.colorSpace),J=r.convert(ie.type),ee=S(ie.internalFormat,se,J,ie.normalized,ie.colorSpace);ft(_)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ut(_),ee,_.width,_.height):O?i.renderbufferStorageMultisample(i.RENDERBUFFER,ut(_),ee,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,ee,_.width,_.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function gt(A,_,O){let W=_.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(i.FRAMEBUFFER,A),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let j=n.get(_.depthTexture);if(j.__renderTarget=_,(!j.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),W){if(j.__webglInit===void 0&&(j.__webglInit=!0,_.depthTexture.addEventListener("dispose",E)),j.__webglTexture===void 0){j.__webglTexture=i.createTexture(),t.bindTexture(i.TEXTURE_CUBE_MAP,j.__webglTexture),$e(i.TEXTURE_CUBE_MAP,_.depthTexture);let re=r.convert(_.depthTexture.format),Te=r.convert(_.depthTexture.type),le;_.depthTexture.format===xn?le=i.DEPTH_COMPONENT24:_.depthTexture.format===ri&&(le=i.DEPTH24_STENCIL8);for(let oe=0;oe<6;oe++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,le,_.width,_.height,0,re,Te,null)}}else q(_.depthTexture,0);let ie=j.__webglTexture,se=ut(_),J=W?i.TEXTURE_CUBE_MAP_POSITIVE_X+O:i.TEXTURE_2D,ee=_.depthTexture.format===ri?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(_.depthTexture.format===xn)ft(_)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ee,J,ie,0,se):i.framebufferTexture2D(i.FRAMEBUFFER,ee,J,ie,0);else if(_.depthTexture.format===ri)ft(_)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ee,J,ie,0,se):i.framebufferTexture2D(i.FRAMEBUFFER,ee,J,ie,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function ze(A){let _=n.get(A),O=A.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==A.depthTexture){let W=A.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),W){let j=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,W.removeEventListener("dispose",j)};W.addEventListener("dispose",j),_.__depthDisposeCallback=j}_.__boundDepthTexture=W}if(A.depthTexture&&!_.__autoAllocateDepthBuffer)if(O)for(let W=0;W<6;W++)gt(_.__webglFramebuffer[W],A,W);else{let W=A.texture.mipmaps;W&&W.length>0?gt(_.__webglFramebuffer[0],A,0):gt(_.__webglFramebuffer,A,0)}else if(O){_.__webglDepthbuffer=[];for(let W=0;W<6;W++)if(t.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[W]),_.__webglDepthbuffer[W]===void 0)_.__webglDepthbuffer[W]=i.createRenderbuffer(),Be(_.__webglDepthbuffer[W],A,!1);else{let j=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ie=_.__webglDepthbuffer[W];i.bindRenderbuffer(i.RENDERBUFFER,ie),i.framebufferRenderbuffer(i.FRAMEBUFFER,j,i.RENDERBUFFER,ie)}}else{let W=A.texture.mipmaps;if(W&&W.length>0?t.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=i.createRenderbuffer(),Be(_.__webglDepthbuffer,A,!1);else{let j=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ie=_.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,ie),i.framebufferRenderbuffer(i.FRAMEBUFFER,j,i.RENDERBUFFER,ie)}}t.bindFramebuffer(i.FRAMEBUFFER,null)}function qe(A,_,O){let W=n.get(A);_!==void 0&&me(W.__webglFramebuffer,A,A.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),O!==void 0&&ze(A)}function it(A){let _=A.texture,O=n.get(A),W=n.get(_);A.addEventListener("dispose",y);let j=A.textures,ie=A.isWebGLCubeRenderTarget===!0,se=j.length>1;if(se||(W.__webglTexture===void 0&&(W.__webglTexture=i.createTexture()),W.__version=_.version,o.memory.textures++),ie){O.__webglFramebuffer=[];for(let J=0;J<6;J++)if(_.mipmaps&&_.mipmaps.length>0){O.__webglFramebuffer[J]=[];for(let ee=0;ee<_.mipmaps.length;ee++)O.__webglFramebuffer[J][ee]=i.createFramebuffer()}else O.__webglFramebuffer[J]=i.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){O.__webglFramebuffer=[];for(let J=0;J<_.mipmaps.length;J++)O.__webglFramebuffer[J]=i.createFramebuffer()}else O.__webglFramebuffer=i.createFramebuffer();if(se)for(let J=0,ee=j.length;J<ee;J++){let re=n.get(j[J]);re.__webglTexture===void 0&&(re.__webglTexture=i.createTexture(),o.memory.textures++)}if(A.samples>0&&ft(A)===!1){O.__webglMultisampledFramebuffer=i.createFramebuffer(),O.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let J=0;J<j.length;J++){let ee=j[J];O.__webglColorRenderbuffer[J]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,O.__webglColorRenderbuffer[J]);let re=r.convert(ee.format,ee.colorSpace),Te=r.convert(ee.type),le=S(ee.internalFormat,re,Te,ee.normalized,ee.colorSpace,A.isXRRenderTarget===!0),oe=ut(A);i.renderbufferStorageMultisample(i.RENDERBUFFER,oe,le,A.width,A.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+J,i.RENDERBUFFER,O.__webglColorRenderbuffer[J])}i.bindRenderbuffer(i.RENDERBUFFER,null),A.depthBuffer&&(O.__webglDepthRenderbuffer=i.createRenderbuffer(),Be(O.__webglDepthRenderbuffer,A,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(ie){t.bindTexture(i.TEXTURE_CUBE_MAP,W.__webglTexture),$e(i.TEXTURE_CUBE_MAP,_);for(let J=0;J<6;J++)if(_.mipmaps&&_.mipmaps.length>0)for(let ee=0;ee<_.mipmaps.length;ee++)me(O.__webglFramebuffer[J][ee],A,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+J,ee);else me(O.__webglFramebuffer[J],A,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0);p(_)&&x(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(se){for(let J=0,ee=j.length;J<ee;J++){let re=j[J],Te=n.get(re),le=i.TEXTURE_2D;(A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(le=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(le,Te.__webglTexture),$e(le,re),me(O.__webglFramebuffer,A,re,i.COLOR_ATTACHMENT0+J,le,0),p(re)&&x(le)}t.unbindTexture()}else{let J=i.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(J=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(J,W.__webglTexture),$e(J,_),_.mipmaps&&_.mipmaps.length>0)for(let ee=0;ee<_.mipmaps.length;ee++)me(O.__webglFramebuffer[ee],A,_,i.COLOR_ATTACHMENT0,J,ee);else me(O.__webglFramebuffer,A,_,i.COLOR_ATTACHMENT0,J,0);p(_)&&x(J),t.unbindTexture()}A.depthBuffer&&ze(A)}function Ge(A){let _=A.textures;for(let O=0,W=_.length;O<W;O++){let j=_[O];if(p(j)){let ie=R(A),se=n.get(j).__webglTexture;t.bindTexture(ie,se),x(ie),t.unbindTexture()}}}let lt=[],xt=[];function Bt(A){if(A.samples>0){if(ft(A)===!1){let _=A.textures,O=A.width,W=A.height,j=i.COLOR_BUFFER_BIT,ie=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,se=n.get(A),J=_.length>1;if(J)for(let re=0;re<_.length;re++)t.bindFramebuffer(i.FRAMEBUFFER,se.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+re,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,se.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+re,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,se.__webglMultisampledFramebuffer);let ee=A.texture.mipmaps;ee&&ee.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,se.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,se.__webglFramebuffer);for(let re=0;re<_.length;re++){if(A.resolveDepthBuffer&&(A.depthBuffer&&(j|=i.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&(j|=i.STENCIL_BUFFER_BIT)),J){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,se.__webglColorRenderbuffer[re]);let Te=n.get(_[re]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Te,0)}i.blitFramebuffer(0,0,O,W,0,0,O,W,j,i.NEAREST),c===!0&&(lt.length=0,xt.length=0,lt.push(i.COLOR_ATTACHMENT0+re),A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&(lt.push(ie),xt.push(ie),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,xt)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,lt))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),J)for(let re=0;re<_.length;re++){t.bindFramebuffer(i.FRAMEBUFFER,se.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+re,i.RENDERBUFFER,se.__webglColorRenderbuffer[re]);let Te=n.get(_[re]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,se.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+re,i.TEXTURE_2D,Te,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,se.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&c){let _=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[_])}}}function ut(A){return Math.min(s.maxSamples,A.samples)}function ft(A){let _=n.get(A);return A.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function U(A){let _=o.render.frame;h.get(A)!==_&&(h.set(A,_),A.update())}function At(A,_){let O=A.colorSpace,W=A.format,j=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||O!==As&&O!==Dn&&(He.getTransfer(O)===Ze?(W!==tn||j!==$t)&&Ce("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Pe("WebGLTextures: Unsupported texture color space:",O)),_}function Qe(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(l.width=A.naturalWidth||A.width,l.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(l.width=A.displayWidth,l.height=A.displayHeight):(l.width=A.width,l.height=A.height),l}this.allocateTextureUnit=H,this.resetTextureUnits=L,this.getTextureUnits=C,this.setTextureUnits=F,this.setTexture2D=q,this.setTexture2DArray=X,this.setTexture3D=K,this.setTextureCube=Z,this.rebindTextures=qe,this.setupRenderTarget=it,this.updateRenderTargetMipmap=Ge,this.updateMultisampleRenderTarget=Bt,this.setupDepthRenderbuffer=ze,this.setupFrameBufferTexture=me,this.useMultisampledRTT=ft,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function ey(i,e){function t(n,s=Dn){let r,o=He.getTransfer(s);if(n===$t)return i.UNSIGNED_BYTE;if(n===Lo)return i.UNSIGNED_SHORT_4_4_4_4;if(n===ko)return i.UNSIGNED_SHORT_5_5_5_1;if(n===$c)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===jc)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===Wc)return i.BYTE;if(n===Xc)return i.SHORT;if(n===is)return i.UNSIGNED_SHORT;if(n===Io)return i.INT;if(n===hn)return i.UNSIGNED_INT;if(n===un)return i.FLOAT;if(n===dn)return i.HALF_FLOAT;if(n===qc)return i.ALPHA;if(n===Yc)return i.RGB;if(n===tn)return i.RGBA;if(n===xn)return i.DEPTH_COMPONENT;if(n===ri)return i.DEPTH_STENCIL;if(n===Jc)return i.RED;if(n===Do)return i.RED_INTEGER;if(n===oi)return i.RG;if(n===No)return i.RG_INTEGER;if(n===Uo)return i.RGBA_INTEGER;if(n===qs||n===Ys||n===Js||n===Ks)if(o===Ze)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===qs)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Ys)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Js)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Ks)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===qs)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Ys)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Js)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Ks)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Fo||n===Oo||n===Bo||n===zo)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Fo)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Oo)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Bo)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===zo)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Vo||n===Go||n===Ho||n===Wo||n===Xo||n===Zs||n===$o)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Vo||n===Go)return o===Ze?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Ho)return o===Ze?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===Wo)return r.COMPRESSED_R11_EAC;if(n===Xo)return r.COMPRESSED_SIGNED_R11_EAC;if(n===Zs)return r.COMPRESSED_RG11_EAC;if(n===$o)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===jo||n===qo||n===Yo||n===Jo||n===Ko||n===Zo||n===Qo||n===ea||n===ta||n===na||n===ia||n===sa||n===ra||n===oa)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===jo)return o===Ze?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===qo)return o===Ze?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Yo)return o===Ze?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Jo)return o===Ze?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Ko)return o===Ze?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Zo)return o===Ze?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Qo)return o===Ze?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ea)return o===Ze?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===ta)return o===Ze?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===na)return o===Ze?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===ia)return o===Ze?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===sa)return o===Ze?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ra)return o===Ze?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===oa)return o===Ze?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===aa||n===ca||n===la)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===aa)return o===Ze?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===ca)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===la)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===ha||n===ua||n===Qs||n===da)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===ha)return r.COMPRESSED_RED_RGTC1_EXT;if(n===ua)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Qs)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===da)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===ss?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}var ty=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,ny=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,gl=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new Us(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Yt({vertexShader:ty,fragmentShader:ny,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Xt(new bi(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},_l=class extends bn{constructor(e,t){super();let n=this,s=null,r=1,o=null,a="local-floor",c=1,l=null,h=null,d=null,u=null,f=null,g=null,b=typeof XRWebGLBinding<"u",m=new gl,p={},x=t.getContextAttributes(),R=null,S=null,M=[],w=[],E=new We,y=null,T=null,P=new Pt;P.viewport=new ht;let I=new Pt;I.viewport=new ht;let k=[P,I],L=new Eo,C=null,F=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Y){let te=M[Y];return te===void 0&&(te=new Ki,M[Y]=te),te.getTargetRaySpace()},this.getControllerGrip=function(Y){let te=M[Y];return te===void 0&&(te=new Ki,M[Y]=te),te.getGripSpace()},this.getHand=function(Y){let te=M[Y];return te===void 0&&(te=new Ki,M[Y]=te),te.getHandSpace()};function H(Y){let te=w.indexOf(Y.inputSource);if(te===-1)return;let _e=M[te];_e!==void 0&&(_e.update(Y.inputSource,Y.frame,l||o),_e.dispatchEvent({type:Y.type,data:Y.inputSource}))}function V(){s.removeEventListener("select",H),s.removeEventListener("selectstart",H),s.removeEventListener("selectend",H),s.removeEventListener("squeeze",H),s.removeEventListener("squeezestart",H),s.removeEventListener("squeezeend",H),s.removeEventListener("end",V),s.removeEventListener("inputsourceschange",q);for(let Y=0;Y<M.length;Y++){let te=w[Y];te!==null&&(w[Y]=null,M[Y].disconnect(te))}C=null,F=null,m.reset();for(let Y in p)delete p[Y];if(e.setRenderTarget(R),f=null,u=null,d=null,s=null,S=null,Ye.stop(),n.isPresenting=!1,e.setPixelRatio(y),e.setSize(E.width,E.height,!1),T!==null){let Y=T.camera;Y.fov=T.fov,Y.zoom=T.zoom,Y.updateProjectionMatrix(),T=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Y){r=Y,n.isPresenting===!0&&Ce("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Y){a=Y,n.isPresenting===!0&&Ce("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(Y){l=Y},this.getBaseLayer=function(){return u!==null?u:f},this.getBinding=function(){return d===null&&b&&(d=new XRWebGLBinding(s,t)),d},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(Y){if(s=Y,s!==null){if(R=e.getRenderTarget(),s.addEventListener("select",H),s.addEventListener("selectstart",H),s.addEventListener("selectend",H),s.addEventListener("squeeze",H),s.addEventListener("squeezestart",H),s.addEventListener("squeezeend",H),s.addEventListener("end",V),s.addEventListener("inputsourceschange",q),x.xrCompatible!==!0&&await t.makeXRCompatible(),y=e.getPixelRatio(),e.getSize(E),b&&"createProjectionLayer"in XRWebGLBinding.prototype){let _e=null,ke=null,me=null;x.depth&&(me=x.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,_e=x.stencil?ri:xn,ke=x.stencil?ss:hn);let Be={colorFormat:t.RGBA8,depthFormat:me,scaleFactor:r};d=this.getBinding(),u=d.createProjectionLayer(Be),s.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),S=new Ht(u.textureWidth,u.textureHeight,{format:tn,type:$t,depthTexture:new Zn(u.textureWidth,u.textureHeight,ke,void 0,void 0,void 0,void 0,void 0,void 0,_e),stencilBuffer:x.stencil,colorSpace:e.outputColorSpace,samples:x.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}else{let _e={antialias:x.antialias,alpha:!0,depth:x.depth,stencil:x.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,t,_e),s.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),S=new Ht(f.framebufferWidth,f.framebufferHeight,{format:tn,type:$t,colorSpace:e.outputColorSpace,stencilBuffer:x.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}S.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await s.requestReferenceSpace(a),Ye.setContext(s),Ye.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function q(Y){for(let te=0;te<Y.removed.length;te++){let _e=Y.removed[te],ke=w.indexOf(_e);ke>=0&&(w[ke]=null,M[ke].disconnect(_e))}for(let te=0;te<Y.added.length;te++){let _e=Y.added[te],ke=w.indexOf(_e);if(ke===-1){for(let Be=0;Be<M.length;Be++)if(Be>=w.length){w.push(_e),ke=Be;break}else if(w[Be]===null){w[Be]=_e,ke=Be;break}if(ke===-1)break}let me=M[ke];me&&me.connect(_e)}}let X=new G,K=new G;function Z(Y,te,_e){X.setFromMatrixPosition(te.matrixWorld),K.setFromMatrixPosition(_e.matrixWorld);let ke=X.distanceTo(K),me=te.projectionMatrix.elements,Be=_e.projectionMatrix.elements,gt=me[14]/(me[10]-1),ze=me[14]/(me[10]+1),qe=(me[9]+1)/me[5],it=(me[9]-1)/me[5],Ge=(me[8]-1)/me[0],lt=(Be[8]+1)/Be[0],xt=gt*Ge,Bt=gt*lt,ut=ke/(-Ge+lt),ft=ut*-Ge;if(te.matrixWorld.decompose(Y.position,Y.quaternion,Y.scale),Y.translateX(ft),Y.translateZ(ut),Y.matrixWorld.compose(Y.position,Y.quaternion,Y.scale),Y.matrixWorldInverse.copy(Y.matrixWorld).invert(),me[10]===-1)Y.projectionMatrix.copy(te.projectionMatrix),Y.projectionMatrixInverse.copy(te.projectionMatrixInverse);else{let U=gt+ut,At=ze+ut,Qe=xt-ft,A=Bt+(ke-ft),_=qe*ze/At*U,O=it*ze/At*U;Y.projectionMatrix.makePerspective(Qe,A,_,O,U,At),Y.projectionMatrixInverse.copy(Y.projectionMatrix).invert()}}function be(Y,te){te===null?Y.matrixWorld.copy(Y.matrix):Y.matrixWorld.multiplyMatrices(te.matrixWorld,Y.matrix),Y.matrixWorldInverse.copy(Y.matrixWorld).invert()}this.updateCamera=function(Y){if(s===null)return;let te=Y.near,_e=Y.far;m.texture!==null&&(m.depthNear>0&&(te=m.depthNear),m.depthFar>0&&(_e=m.depthFar)),L.near=I.near=P.near=te,L.far=I.far=P.far=_e,(C!==L.near||F!==L.far)&&(s.updateRenderState({depthNear:L.near,depthFar:L.far}),C=L.near,F=L.far),L.layers.mask=Y.layers.mask|6,P.layers.mask=L.layers.mask&-5,I.layers.mask=L.layers.mask&-3;let ke=Y.parent,me=L.cameras;be(L,ke);for(let Be=0;Be<me.length;Be++)be(me[Be],ke);me.length===2?Z(L,P,I):L.projectionMatrix.copy(P.projectionMatrix),T===null&&Y.isPerspectiveCamera&&(T={camera:Y,fov:Y.fov,zoom:Y.zoom}),ve(Y,L,ke)};function ve(Y,te,_e){_e===null?Y.matrix.copy(te.matrixWorld):(Y.matrix.copy(_e.matrixWorld),Y.matrix.invert(),Y.matrix.multiply(te.matrixWorld)),Y.matrix.decompose(Y.position,Y.quaternion,Y.scale),Y.updateMatrixWorld(!0),Y.projectionMatrix.copy(te.projectionMatrix),Y.projectionMatrixInverse.copy(te.projectionMatrixInverse),Y.isPerspectiveCamera&&(Y.fov=so*2*Math.atan(1/Y.projectionMatrix.elements[5]),Y.zoom=1)}this.getCamera=function(){return L},this.getFoveation=function(){if(!(u===null&&f===null))return c},this.setFoveation=function(Y){c=Y,u!==null&&(u.fixedFoveation=Y),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=Y)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(L)},this.getCameraTexture=function(Y){return p[Y]};let nt=null;function $e(Y,te){if(h=te.getViewerPose(l||o),g=te,h!==null){let _e=h.views;f!==null&&(e.setRenderTargetFramebuffer(S,f.framebuffer),e.setRenderTarget(S));let ke=!1;_e.length!==L.cameras.length&&(L.cameras.length=0,ke=!0);for(let ze=0;ze<_e.length;ze++){let qe=_e[ze],it=null;if(f!==null)it=f.getViewport(qe);else{let lt=d.getViewSubImage(u,qe);it=lt.viewport,ze===0&&(e.setRenderTargetTextures(S,lt.colorTexture,lt.depthStencilTexture),e.setRenderTarget(S))}let Ge=k[ze];Ge===void 0&&(Ge=new Pt,Ge.layers.enable(ze),Ge.viewport=new ht,k[ze]=Ge),Ge.matrix.fromArray(qe.transform.matrix),Ge.matrix.decompose(Ge.position,Ge.quaternion,Ge.scale),Ge.projectionMatrix.fromArray(qe.projectionMatrix),Ge.projectionMatrixInverse.copy(Ge.projectionMatrix).invert(),Ge.viewport.set(it.x,it.y,it.width,it.height),ze===0&&(L.matrix.copy(Ge.matrix),L.matrix.decompose(L.position,L.quaternion,L.scale)),ke===!0&&L.cameras.push(Ge)}let me=s.enabledFeatures;if(me&&me.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&b){d=n.getBinding();let ze=d.getDepthInformation(_e[0]);ze&&ze.isValid&&ze.texture&&m.init(ze,s.renderState)}if(me&&me.includes("camera-access")&&b){e.state.unbindTexture(),d=n.getBinding();for(let ze=0;ze<_e.length;ze++){let qe=_e[ze].camera;if(qe){let it=p[qe];it||(it=new Us,p[qe]=it);let Ge=d.getCameraImage(qe);it.sourceTexture=Ge}}}}for(let _e=0;_e<M.length;_e++){let ke=w[_e],me=M[_e];ke!==null&&me!==void 0&&me.update(ke,te,l||o)}nt&&nt(Y,te),te.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:te}),g=null}let Ye=new ju;Ye.setAnimationLoop($e),this.setAnimationLoop=function(Y){nt=Y},this.dispose=function(){}}},iy=new ct,Qu=new Le;Qu.set(-1,0,0,0,1,0,0,0,1);function sy(i,e){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,Qc(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,x,R,S){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?r(m,p):p.isMeshLambertMaterial?(r(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(r(m,p),d(m,p)):p.isMeshPhongMaterial?(r(m,p),h(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(r(m,p),u(m,p),p.isMeshPhysicalMaterial&&f(m,p,S)):p.isMeshMatcapMaterial?(r(m,p),g(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),b(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(o(m,p),p.isLineDashedMaterial&&a(m,p)):p.isPointsMaterial?c(m,p,x,R):p.isSpriteMaterial?l(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Ot&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Ot&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);let x=e.get(p),R=x.envMap,S=x.envMapRotation;R&&(m.envMap.value=R,m.envMapRotation.value.setFromMatrix4(iy.makeRotationFromEuler(S)).transpose(),R.isCubeTexture&&R.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(Qu),m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function o(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function a(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function c(m,p,x,R){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*x,m.scale.value=R*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function l(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function h(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function d(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function u(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function f(m,p,x){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Ot&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.retroreflectivity>0&&(m.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=x.texture,m.transmissionSamplerSize.value.set(x.width,x.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function b(m,p){let x=e.get(p).light;m.referencePosition.value.setFromMatrixPosition(x.matrixWorld),m.nearDistance.value=x.shadow.camera.near,m.farDistance.value=x.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function ry(i,e,t,n){let s={},r={},o=[],a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(S,M){let w=M.program;n.uniformBlockBinding(S,w)}function l(S,M){let w=s[S.id];w===void 0&&(m(S),w=h(S),s[S.id]=w,S.addEventListener("dispose",x));let E=M.program;n.updateUBOMapping(S,E);let y=e.render.frame;r[S.id]!==y&&(u(S),r[S.id]=y)}function h(S){let M=d();S.__bindingPointIndex=M;let w=i.createBuffer(),E=S.__size,y=S.usage;return i.bindBuffer(i.UNIFORM_BUFFER,w),i.bufferData(i.UNIFORM_BUFFER,E,y),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,M,w),w}function d(){for(let S=0;S<a;S++)if(o.indexOf(S)===-1)return o.push(S),S;return Pe("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(S){let M=s[S.id],w=S.uniforms,E=S.__cache;i.bindBuffer(i.UNIFORM_BUFFER,M);for(let y=0,T=w.length;y<T;y++){let P=w[y];if(Array.isArray(P))for(let I=0,k=P.length;I<k;I++)f(P[I],y,I,E);else f(P,y,0,E)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(S,M,w,E){if(b(S,M,w,E)===!0){let y=S.__offset,T=S.value;if(Array.isArray(T)){let P=0;for(let I=0;I<T.length;I++){let k=T[I],L=p(k);g(k,S.__data,P),typeof k!="number"&&typeof k!="boolean"&&!k.isMatrix3&&!ArrayBuffer.isView(k)&&(P+=L.storage/Float32Array.BYTES_PER_ELEMENT)}}else g(T,S.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,y,S.__data)}}function g(S,M,w){typeof S=="number"||typeof S=="boolean"?M[0]=S:S.isMatrix3?(M[0]=S.elements[0],M[1]=S.elements[1],M[2]=S.elements[2],M[3]=0,M[4]=S.elements[3],M[5]=S.elements[4],M[6]=S.elements[5],M[7]=0,M[8]=S.elements[6],M[9]=S.elements[7],M[10]=S.elements[8],M[11]=0):ArrayBuffer.isView(S)?M.set(new S.constructor(S.buffer,S.byteOffset,M.length)):S.toArray(M,w)}function b(S,M,w,E){let y=S.value,T=M+"_"+w;if(E[T]===void 0)return typeof y=="number"||typeof y=="boolean"?E[T]=y:ArrayBuffer.isView(y)?E[T]=y.slice():E[T]=y.clone(),!0;{let P=E[T];if(typeof y=="number"||typeof y=="boolean"){if(P!==y)return E[T]=y,!0}else{if(ArrayBuffer.isView(y))return!0;if(P.equals(y)===!1)return P.copy(y),!0}}return!1}function m(S){let M=S.uniforms,w=0,E=16;for(let T=0,P=M.length;T<P;T++){let I=Array.isArray(M[T])?M[T]:[M[T]];for(let k=0,L=I.length;k<L;k++){let C=I[k],F=Array.isArray(C.value)?C.value:[C.value];for(let H=0,V=F.length;H<V;H++){let q=F[H],X=p(q),K=w%E,Z=K%X.boundary,be=K+Z;w+=Z,be!==0&&E-be<X.storage&&(w+=E-be),C.__data=new Float32Array(X.storage/Float32Array.BYTES_PER_ELEMENT),C.__offset=w,w+=X.storage}}}let y=w%E;return y>0&&(w+=E-y),S.__size=w,S.__cache={},this}function p(S){let M={boundary:0,storage:0};return typeof S=="number"||typeof S=="boolean"?(M.boundary=4,M.storage=4):S.isVector2?(M.boundary=8,M.storage=8):S.isVector3||S.isColor?(M.boundary=16,M.storage=12):S.isVector4?(M.boundary=16,M.storage=16):S.isMatrix3?(M.boundary=48,M.storage=48):S.isMatrix4?(M.boundary=64,M.storage=64):S.isTexture?Ce("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(S)?(M.boundary=16,M.storage=S.byteLength):Ce("WebGLRenderer: Unsupported uniform value type.",S),M}function x(S){let M=S.target;M.removeEventListener("dispose",x);let w=o.indexOf(M.__bindingPointIndex);o.splice(w,1),i.deleteBuffer(s[M.id]),delete s[M.id],delete r[M.id]}function R(){for(let S in s)i.deleteBuffer(s[S]);o=[],s={},r={}}return{bind:c,update:l,dispose:R}}var oy=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),wn=null;function ay(){return wn===null&&(wn=new lo(oy,16,16,oi,dn),wn.name="DFG_LUT",wn.minFilter=Tt,wn.magFilter=Tt,wn.wrapS=_n,wn.wrapT=_n,wn.generateMipmaps=!1,wn.needsUpdate=!0),wn}var ba=class{constructor(e={}){let{canvas:t=yu(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:u=!1,outputBufferType:f=$t}=e;this.isWebGLRenderer=!0;let g;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=n.getContextAttributes().alpha}else g=o;let b=f,m=new Set([Uo,No,Do]),p=new Set([$t,hn,is,ss,Lo,ko]),x=new Uint32Array(4),R=new Int32Array(4),S=new G,M=null,w=null,E=[],y=[],T=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=ln,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let P=this,I=!1,k=null,L=null,C=null,F=null;this._outputColorSpace=Ut;let H=0,V=0,q=null,X=-1,K=null,Z=new ht,be=new ht,ve=null,nt=new Fe(0),$e=0,Ye=t.width,Y=t.height,te=1,_e=null,ke=null,me=new ht(0,0,Ye,Y),Be=new ht(0,0,Ye,Y),gt=!1,ze=new Qi,qe=!1,it=!1,Ge=new ct,lt=new G,xt=new ht,Bt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},ut=!1;function ft(){return q===null?te:1}let U=n;function At(v,D){return t.getContext(v,D)}let Qe,A,_,O,W,j,ie,se,J,ee,re,Te,le,oe,Ae,Re,De,N,ae,Q,ce,fe,ne;try{let v={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"186"}`),t.addEventListener("webglcontextlost",st,!1),t.addEventListener("webglcontextrestored",Je,!1),t.addEventListener("webglcontextcreationerror",nn,!1),U===null){let D="webgl2";if(U=At(D,v),U===null)throw At(D)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Ee()}catch(v){throw t.removeEventListener("webglcontextlost",st,!1),t.removeEventListener("webglcontextrestored",Je,!1),t.removeEventListener("webglcontextcreationerror",nn,!1),Pe("WebGLRenderer: "+v.message),v}function Ee(){Qe=new p0(U),Qe.init(),ce=new ey(U,Qe),A=new s0(U,Qe,e,ce),_=new Z_(U,Qe),A.reversedDepthBuffer&&u&&_.buffers.depth.setReversed(!0),L=U.createFramebuffer(),C=U.createFramebuffer(),F=U.createFramebuffer(),O=new _0(U),W=new O_,j=new Q_(U,Qe,_,W,A,ce,O),ie=new f0(P),se=new xp(U),fe=new n0(U,se),J=new m0(U,se,O,fe),ee=new x0(U,J,se,fe,O),N=new y0(U,A,j),Ae=new r0(W),re=new F_(P,ie,Qe,A,fe,Ae),Te=new sy(P,W),le=new z_,oe=new $_(Qe),De=new t0(P,ie,_,ee,g,c),Re=new K_(P,ee,A),ne=new ry(U,O,A,_),ae=new i0(U,Qe,O),Q=new g0(U,Qe,O),O.programs=re.programs,P.capabilities=A,P.extensions=Qe,P.properties=W,P.renderLists=le,P.shadowMap=Re,P.state=_,P.info=O}b!==$t&&(T=new v0(b,t.width,t.height,a,s,r));let Me=new _l(P,U);this.xr=Me,this.getContext=function(){return U},this.getContextAttributes=function(){return U.getContextAttributes()},this.forceContextLoss=function(){let v=Qe.get("WEBGL_lose_context");v&&v.loseContext()},this.forceContextRestore=function(){let v=Qe.get("WEBGL_lose_context");v&&v.restoreContext()},this.getPixelRatio=function(){return te},this.setPixelRatio=function(v){v!==void 0&&(te=v,this.setSize(Ye,Y,!1))},this.getSize=function(v){return v.set(Ye,Y)},this.setSize=function(v,D,$=!0){if(Me.isPresenting){Ce("WebGLRenderer: Can't change size while VR device is presenting.");return}Ye=v,Y=D,t.width=Math.floor(v*te),t.height=Math.floor(D*te),$===!0&&(t.style.width=v+"px",t.style.height=D+"px"),T!==null&&T.setSize(t.width,t.height),this.setViewport(0,0,v,D)},this.getDrawingBufferSize=function(v){return v.set(Ye*te,Y*te).floor()},this.setDrawingBufferSize=function(v,D,$){Ye=v,Y=D,te=$,t.width=Math.floor(v*$),t.height=Math.floor(D*$),this.setViewport(0,0,v,D)},this.setEffects=function(v){if(b===$t){Pe("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(v){for(let D=0;D<v.length;D++)if(v[D].isOutputPass===!0){Ce("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}T.setEffects(v||[])},this.getCurrentViewport=function(v){return v.copy(Z)},this.getViewport=function(v){return v.copy(me)},this.setViewport=function(v,D,$,B){v.isVector4?me.set(v.x,v.y,v.z,v.w):me.set(v,D,$,B),_.viewport(Z.copy(me).multiplyScalar(te).round())},this.getScissor=function(v){return v.copy(Be)},this.setScissor=function(v,D,$,B){v.isVector4?Be.set(v.x,v.y,v.z,v.w):Be.set(v,D,$,B),_.scissor(be.copy(Be).multiplyScalar(te).round())},this.getScissorTest=function(){return gt},this.setScissorTest=function(v){_.setScissorTest(gt=v)},this.setOpaqueSort=function(v){_e=v},this.setTransparentSort=function(v){ke=v},this.getClearColor=function(v){return v.copy(De.getClearColor())},this.setClearColor=function(){De.setClearColor(...arguments)},this.getClearAlpha=function(){return De.getClearAlpha()},this.setClearAlpha=function(){De.setClearAlpha(...arguments)},this.clear=function(v=!0,D=!0,$=!0){let B=0;if(v){let z=!1;if(q!==null){let de=q.texture.format;z=m.has(de)}if(z){let de=q.texture.type,ge=p.has(de),ue=De.getClearColor(),ye=De.getClearAlpha(),we=ue.r,Ue=ue.g,Ve=ue.b;ge?(x[0]=we,x[1]=Ue,x[2]=Ve,x[3]=ye,U.clearBufferuiv(U.COLOR,0,x)):(R[0]=we,R[1]=Ue,R[2]=Ve,R[3]=ye,U.clearBufferiv(U.COLOR,0,R))}else B|=U.COLOR_BUFFER_BIT}D&&(B|=U.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),$&&(B|=U.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),B!==0&&U.clear(B)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(v){v.setRenderer(this),k=v},this.dispose=function(){t.removeEventListener("webglcontextlost",st,!1),t.removeEventListener("webglcontextrestored",Je,!1),t.removeEventListener("webglcontextcreationerror",nn,!1),De.dispose(),le.dispose(),oe.dispose(),W.dispose(),ie.dispose(),ee.dispose(),fe.dispose(),ne.dispose(),re.dispose(),Me.dispose(),Me.removeEventListener("sessionstart",ch),Me.removeEventListener("sessionend",lh),pi.stop()};function st(v){v.preventDefault(),Zc("WebGLRenderer: Context Lost."),I=!0}function Je(){Zc("WebGLRenderer: Context Restored."),I=!1;let v=O.autoReset,D=Re.enabled,$=Re.autoUpdate,B=Re.needsUpdate,z=Re.type;Ee(),O.autoReset=v,Re.enabled=D,Re.autoUpdate=$,Re.needsUpdate=B,Re.type=z}function nn(v){Pe("WebGLRenderer: A WebGL context could not be created. Reason: ",v.statusMessage)}function pn(v){let D=v.target;D.removeEventListener("dispose",pn),Cf(D)}function Cf(v){Pf(v),W.remove(v)}function Pf(v){let D=W.get(v).programs;D!==void 0&&(D.forEach(function($){re.releaseProgram($)}),v.isShaderMaterial&&re.releaseShaderCache(v))}this.renderBufferDirect=function(v,D,$,B,z,de){D===null&&(D=Bt);let ge=z.isMesh&&z.matrixWorld.determinantAffine()<0,ue=kf(v,D,$,B,z);_.setMaterial(B,ge);let ye=$.index,we=1;if(B.wireframe===!0){if(ye=J.getWireframeAttribute($),ye===void 0)return;we=2}let Ue=$.drawRange,Ve=$.attributes.position,xe=Ue.start*we,Ke=(Ue.start+Ue.count)*we;de!==null&&(xe=Math.max(xe,de.start*we),Ke=Math.min(Ke,(de.start+de.count)*we)),ye!==null?(xe=Math.max(xe,0),Ke=Math.min(Ke,ye.count)):Ve!=null&&(xe=Math.max(xe,0),Ke=Math.min(Ke,Ve.count));let pt=Ke-xe;if(pt<0||pt===1/0)return;fe.setup(z,B,ue,$,ye);let ot,tt=ae;if(ye!==null&&(ot=se.get(ye),tt=Q,tt.setIndex(ot)),z.isMesh)B.wireframe===!0?(_.setLineWidth(B.wireframeLinewidth*ft()),tt.setMode(U.LINES)):tt.setMode(U.TRIANGLES);else if(z.isLine){let Et=B.linewidth;Et===void 0&&(Et=1),_.setLineWidth(Et*ft()),z.isLineSegments?tt.setMode(U.LINES):z.isLineLoop?tt.setMode(U.LINE_LOOP):tt.setMode(U.LINE_STRIP)}else z.isPoints?tt.setMode(U.POINTS):z.isSprite&&tt.setMode(U.TRIANGLES);if(z.isBatchedMesh)if(Qe.get("WEBGL_multi_draw"))tt.renderMultiDraw(z._multiDrawStarts,z._multiDrawCounts,z._multiDrawCount);else{let Et=z._multiDrawStarts,pe=z._multiDrawCounts,Nt=z._multiDrawCount,je=ye?se.get(ye).bytesPerElement:1,Zt=W.get(B).currentProgram.getUniforms();for(let mn=0;mn<Nt;mn++)Zt.setValue(U,"_gl_DrawID",mn),tt.render(Et[mn]/je,pe[mn])}else if(z.isInstancedMesh)tt.renderInstances(xe,pt,z.count);else if($.isInstancedBufferGeometry){let Et=$._maxInstanceCount!==void 0?$._maxInstanceCount:1/0,pe=Math.min($.instanceCount,Et);tt.renderInstances(xe,pt,pe)}else tt.render(xe,pt)};function ah(v,D,$,B){k!==null&&v.isNodeMaterial&&k.setObject(B,v),qe===!0&&Ae.setState(v,$,!1),v.transparent===!0&&v.side===en&&v.forceSinglePass===!1?(v.side=Ot,v.needsUpdate=!0,Tr(v,D,B),v.side=Sn,v.needsUpdate=!0,Tr(v,D,B),v.side=en):Tr(v,D,B)}this.compile=function(v,D,$=null){$===null&&($=v),k!==null&&k.renderStart(v,D,$),w=oe.get($),w.init(D),y.push(w),$.traverseVisible(function(z){z.isLight&&z.layers.test(D.layers)&&(w.pushLight(z),z.castShadow&&w.pushShadow(z))}),v!==$&&v.traverseVisible(function(z){z.isLight&&z.layers.test(D.layers)&&(w.pushLight(z),z.castShadow&&w.pushShadow(z))}),w.setupLights(),k!==null&&k.updateLights(w.state.lightsArray),it=this.localClippingEnabled,qe=Ae.init(this.clippingPlanes,it),qe===!0&&Ae.setGlobalState(this.clippingPlanes,D),k!==null&&Re.render(w.state.shadowsArray,$,D);let B=new Set;return v.traverse(function(z){if(!(z.isMesh||z.isPoints||z.isLine||z.isSprite))return;let de=z.material;if(de)if(Array.isArray(de))for(let ge=0;ge<de.length;ge++){let ue=de[ge];ah(ue,$,D,z),B.add(ue)}else ah(de,$,D,z),B.add(de)}),w=y.pop(),k!==null&&k.renderEnd(),B},this.compileAsync=function(v,D,$=null){let B=this.compile(v,D,$);return new Promise(z=>{function de(){if(B.forEach(function(ge){let ye=W.get(ge).currentProgram;(ye===void 0||ye.isReady())&&B.delete(ge)}),B.size===0){z(v);return}setTimeout(de,10)}Qe.get("KHR_parallel_shader_compile")!==null?de():setTimeout(de,10)})};let Ka=null;function If(v){Ka&&Ka(v)}function ch(){pi.stop()}function lh(){pi.start()}let pi=new ju;pi.setAnimationLoop(If),typeof self<"u"&&pi.setContext(self),this.setAnimationLoop=function(v){Ka=v,Me.setAnimationLoop(v),v===null?pi.stop():pi.start()},Me.addEventListener("sessionstart",ch),Me.addEventListener("sessionend",lh),this.render=function(v,D){if(D!==void 0&&D.isCamera!==!0){Pe("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(I===!0)return;k!==null&&k.renderStart(v,D);let $=Me.enabled===!0&&Me.isPresenting===!0,B=T!==null&&(q===null||$)&&T.begin(P,q);if(v.matrixWorldAutoUpdate===!0&&v.updateMatrixWorld(),D.parent===null&&D.matrixWorldAutoUpdate===!0&&D.updateMatrixWorld(),Me.enabled===!0&&Me.isPresenting===!0&&(T===null||T.isCompositing()===!1)&&(Me.cameraAutoUpdate===!0&&Me.updateCamera(D),D=Me.getCamera()),v.isScene===!0&&v.onBeforeRender(P,v,D,q),w=oe.get(v,y.length),w.init(D),w.state.textureUnits=j.getTextureUnits(),y.push(w),Ge.multiplyMatrices(D.projectionMatrix,D.matrixWorldInverse),ze.setFromProjectionMatrix(Ge,cn,D.reversedDepth),it=this.localClippingEnabled,qe=Ae.init(this.clippingPlanes,it),M=le.get(v,E.length),M.init(),E.push(M),Me.enabled===!0&&Me.isPresenting===!0){let ge=P.xr.getDepthSensingMesh();ge!==null&&Za(ge,D,-1/0,P.sortObjects)}Za(v,D,0,P.sortObjects),M.finish(),k!==null&&k.updateLights(w.state.lightsArray),P.sortObjects===!0&&M.sort(_e,ke),ut=Me.enabled===!1||Me.isPresenting===!1||Me.hasDepthSensing()===!1,ut&&De.addToRenderList(M,v),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),qe===!0&&Ae.beginShadows();let z=w.state.shadowsArray;if(Re.render(z,v,D),qe===!0&&Ae.endShadows(),(B&&T.hasRenderPass())===!1){let ge=M.opaque,ue=M.transmissive;if(w.setupLights(),D.isArrayCamera){let ye=D.cameras;if(ue.length>0)for(let we=0,Ue=ye.length;we<Ue;we++){let Ve=ye[we];uh(ge,ue,v,Ve)}ut&&De.render(v);for(let we=0,Ue=ye.length;we<Ue;we++){let Ve=ye[we];hh(M,v,Ve,Ve.viewport)}}else ue.length>0&&uh(ge,ue,v,D),ut&&De.render(v),hh(M,v,D)}q!==null&&V===0&&(j.updateMultisampleRenderTarget(q),j.updateRenderTargetMipmap(q)),B&&T.end(P),v.isScene===!0&&v.onAfterRender(P,v,D),fe.resetDefaultState(),X=-1,K=null,y.pop(),y.length>0?(w=y[y.length-1],j.setTextureUnits(w.state.textureUnits),qe===!0&&Ae.setGlobalState(P.clippingPlanes,w.state.camera)):w=null,E.pop(),E.length>0?M=E[E.length-1]:M=null,k!==null&&k.renderEnd()};function Za(v,D,$,B){if(v.visible===!1)return;if(v.layers.test(D.layers)){if(v.isGroup)$=v.renderOrder;else if(v.isLOD)v.autoUpdate===!0&&v.update(D);else if(v.isLightProbeGrid)w.pushLightProbeGrid(v);else if(v.isLight)w.pushLight(v),v.castShadow&&w.pushShadow(v);else if(v.isSprite){if(!v.frustumCulled||v.intersectsFrustum(ze)){B&&xt.setFromMatrixPosition(v.matrixWorld).applyMatrix4(Ge);let ge=ee.update(v),ue=v.material;ue.visible&&M.push(v,ge,ue,$,xt.z,null,D)}}else if((v.isMesh||v.isLine||v.isPoints)&&(!v.frustumCulled||v.intersectsFrustum(ze))){let ge=ee.update(v),ue=v.material;if(B&&(v.boundingSphere!==void 0?(v.boundingSphere===null&&v.computeBoundingSphere(),xt.copy(v.boundingSphere.center)):(ge.boundingSphere===null&&ge.computeBoundingSphere(),xt.copy(ge.boundingSphere.center)),xt.applyMatrix4(v.matrixWorld).applyMatrix4(Ge)),Array.isArray(ue)){let ye=ge.groups;for(let we=0,Ue=ye.length;we<Ue;we++){let Ve=ye[we],xe=ue[Ve.materialIndex];xe&&xe.visible&&M.push(v,ge,xe,$,xt.z,Ve,D)}}else ue.visible&&M.push(v,ge,ue,$,xt.z,null,D)}}let de=v.children;for(let ge=0,ue=de.length;ge<ue;ge++)Za(de[ge],D,$,B)}function hh(v,D,$,B){let{opaque:z,transmissive:de,transparent:ge}=v;w.setupLightsView($),qe===!0&&Ae.setGlobalState(P.clippingPlanes,$),B&&_.viewport(Z.copy(B)),z.length>0&&wr(z,D,$),de.length>0&&wr(de,D,$),ge.length>0&&wr(ge,D,$),_.buffers.depth.setTest(!0),_.buffers.depth.setMask(!0),_.buffers.color.setMask(!0),_.setPolygonOffset(!1)}function uh(v,D,$,B){if(($.isScene===!0?$.overrideMaterial:null)!==null)return;if(w.state.transmissionRenderTarget[B.id]===void 0){let xe=Qe.has("EXT_color_buffer_half_float")||Qe.has("EXT_color_buffer_float");w.state.transmissionRenderTarget[B.id]=new Ht(1,1,{generateMipmaps:!0,type:xe?dn:$t,minFilter:si,samples:Math.max(4,A.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:He.workingColorSpace})}let de=w.state.transmissionRenderTarget[B.id],ge=B.viewport||Z;de.setSize(ge.z*P.transmissionResolutionScale,ge.w*P.transmissionResolutionScale);let ue=P.getRenderTarget(),ye=P.getActiveCubeFace(),we=P.getActiveMipmapLevel();P.setRenderTarget(de),P.getClearColor(nt),$e=P.getClearAlpha(),$e<1&&P.setClearColor(16777215,.5),P.clear(),ut&&De.render($);let Ue=P.toneMapping;P.toneMapping=ln;let Ve=B.viewport;if(B.viewport!==void 0&&(B.viewport=void 0),w.setupLightsView(B),qe===!0&&Ae.setGlobalState(P.clippingPlanes,B),wr(v,$,B),j.updateMultisampleRenderTarget(de),j.updateRenderTargetMipmap(de),Qe.has("WEBGL_multisampled_render_to_texture")===!1){let xe=!1;for(let Ke=0,pt=D.length;Ke<pt;Ke++){let ot=D[Ke],{object:tt,geometry:Et,material:pe,group:Nt}=ot;if(pe.side===en&&tt.layers.test(B.layers)){let je=pe.side;pe.side=Ot,pe.needsUpdate=!0,dh(tt,$,B,Et,pe,Nt),pe.side=je,pe.needsUpdate=!0,xe=!0}}xe===!0&&(j.updateMultisampleRenderTarget(de),j.updateRenderTargetMipmap(de))}P.setRenderTarget(ue,ye,we),P.setClearColor(nt,$e),Ve!==void 0&&(B.viewport=Ve),P.toneMapping=Ue}function wr(v,D,$){let B=D.isScene===!0?D.overrideMaterial:null;for(let z=0,de=v.length;z<de;z++){let ge=v[z],{object:ue,geometry:ye,group:we}=ge,Ue=ge.material;Ue.allowOverride===!0&&B!==null&&(Ue=B),ue.layers.test($.layers)&&dh(ue,D,$,ye,Ue,we)}}function dh(v,D,$,B,z,de){k!==null&&z.isNodeMaterial&&k.setObject(v,z),v.onBeforeRender(P,D,$,B,z,de),v.modelViewMatrix.multiplyMatrices($.matrixWorldInverse,v.matrixWorld),v.normalMatrix.getNormalMatrix(v.modelViewMatrix),z.onBeforeRender(P,D,$,B,v,de),z.transparent===!0&&z.side===en&&z.forceSinglePass===!1?(z.side=Ot,z.needsUpdate=!0,P.renderBufferDirect($,D,B,z,v,de),z.side=Sn,z.needsUpdate=!0,P.renderBufferDirect($,D,B,z,v,de),z.side=en):P.renderBufferDirect($,D,B,z,v,de),v.onAfterRender(P,D,$,B,z,de)}function Tr(v,D,$){D.isScene!==!0&&(D=Bt);let B=W.get(v),z=w.state.lights,de=w.state.shadowsArray,ge=z.state.version,ue=re.getParameters(v,z.state,de,D,$,w.state.lightProbeGridArray),ye=re.getProgramCacheKey(ue),we=B.programs;B.environment=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?D.environment:null,B.fog=D.fog;let Ue=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap;B.envMap=ie.get(v.envMap||B.environment,Ue),B.envMapRotation=B.environment!==null&&v.envMap===null?D.environmentRotation:v.envMapRotation,we===void 0&&(v.addEventListener("dispose",pn),we=new Map,B.programs=we);let Ve=we.get(ye);if(Ve!==void 0){if(B.currentProgram===Ve&&B.lightsStateVersion===ge)return ph(v,ue),Ve}else ue.uniforms=re.getUniforms(v),k!==null&&v.isNodeMaterial&&k.build(v,$,ue),v.onBeforeCompile(ue,P),Ve=re.acquireProgram(ue,ye),we.set(ye,Ve),B.uniforms=ue.uniforms;let xe=B.uniforms;return(!v.isShaderMaterial&&!v.isRawShaderMaterial||v.clipping===!0)&&(xe.clippingPlanes=Ae.uniform),ph(v,ue),B.needsLights=Nf(v),B.lightsStateVersion=ge,B.needsLights&&(xe.ambientLightColor.value=z.state.ambient,xe.lightProbe.value=z.state.probe,xe.sunLights.value=z.state.sun,xe.sunLightShadows.value=z.state.sunShadow,xe.directionalLights.value=z.state.directional,xe.directionalLightShadows.value=z.state.directionalShadow,xe.spotLights.value=z.state.spot,xe.spotLightShadows.value=z.state.spotShadow,xe.rectAreaLights.value=z.state.rectArea,xe.ltc_1.value=z.state.rectAreaLTC1,xe.ltc_2.value=z.state.rectAreaLTC2,xe.pointLights.value=z.state.point,xe.pointLightShadows.value=z.state.pointShadow,xe.hemisphereLights.value=z.state.hemi,xe.sunShadowMatrix.value=z.state.sunShadowMatrix,xe.sunShadowCascade.value=z.state.sunShadowCascade,xe.directionalShadowMatrix.value=z.state.directionalShadowMatrix,xe.spotLightMatrix.value=z.state.spotLightMatrix,xe.spotLightMap.value=z.state.spotLightMap,xe.pointShadowMatrix.value=z.state.pointShadowMatrix),B.lightProbeGrid=w.state.lightProbeGridArray.length>0,B.currentProgram=Ve,B.uniformsList=null,Ve}function fh(v){if(v.uniformsList===null){let D=v.currentProgram.getUniforms();v.uniformsList=as.seqWithValue(D.seq,v.uniforms)}return v.uniformsList}function ph(v,D){let $=W.get(v);$.outputColorSpace=D.outputColorSpace,$.batching=D.batching,$.batchingColor=D.batchingColor,$.instancing=D.instancing,$.instancingColor=D.instancingColor,$.instancingMorph=D.instancingMorph,$.skinning=D.skinning,$.morphTargets=D.morphTargets,$.morphNormals=D.morphNormals,$.morphColors=D.morphColors,$.morphTargetsCount=D.morphTargetsCount,$.numClippingPlanes=D.numClippingPlanes,$.numIntersection=D.numClipIntersection,$.vertexAlphas=D.vertexAlphas,$.vertexTangents=D.vertexTangents,$.toneMapping=D.toneMapping}function Lf(v,D){if(v.length===0)return null;if(v.length===1)return v[0].texture!==null?v[0]:null;S.setFromMatrixPosition(D.matrixWorld);for(let $=0,B=v.length;$<B;$++){let z=v[$];if(z.texture!==null&&z.boundingBox.containsPoint(S))return z}return null}function kf(v,D,$,B,z){D.isScene!==!0&&(D=Bt),j.resetTextureUnits();let de=D.fog,ge=B.isMeshStandardMaterial||B.isMeshLambertMaterial||B.isMeshPhongMaterial?D.environment:null,ue=q===null?P.outputColorSpace:q.isXRRenderTarget===!0?q.texture.colorSpace:He.workingColorSpace,ye=B.isMeshStandardMaterial||B.isMeshLambertMaterial&&!B.envMap||B.isMeshPhongMaterial&&!B.envMap,we=ie.get(B.envMap||ge,ye),Ue=B.vertexColors===!0&&!!$.attributes.color&&$.attributes.color.itemSize===4,Ve=!!$.attributes.tangent&&(!!B.normalMap||B.anisotropy>0),xe=!!$.morphAttributes.position,Ke=!!$.morphAttributes.normal,pt=!!$.morphAttributes.color,ot=ln;B.toneMapped&&(q===null||q.isXRRenderTarget===!0)&&(ot=P.toneMapping);let tt=$.morphAttributes.position||$.morphAttributes.normal||$.morphAttributes.color,Et=tt!==void 0?tt.length:0,pe=W.get(B),Nt=w.state.lights;if(qe===!0&&(it===!0||v!==K)){let rt=v===K&&B.id===X;Ae.setState(B,v,rt)}let je=!1;B.version===pe.__version?(pe.needsLights&&pe.lightsStateVersion!==Nt.state.version||pe.outputColorSpace!==ue||z.isBatchedMesh&&pe.batching===!1||!z.isBatchedMesh&&pe.batching===!0||z.isBatchedMesh&&pe.batchingColor===!0&&z._colorsTexture===null||z.isBatchedMesh&&pe.batchingColor===!1&&z._colorsTexture!==null||z.isInstancedMesh&&pe.instancing===!1||!z.isInstancedMesh&&pe.instancing===!0||z.isSkinnedMesh&&pe.skinning===!1||!z.isSkinnedMesh&&pe.skinning===!0||z.isInstancedMesh&&pe.instancingColor===!0&&z.instanceColor===null||z.isInstancedMesh&&pe.instancingColor===!1&&z.instanceColor!==null||z.isInstancedMesh&&pe.instancingMorph===!0&&z.morphTexture===null||z.isInstancedMesh&&pe.instancingMorph===!1&&z.morphTexture!==null||pe.envMap!==we||B.fog===!0&&pe.fog!==de||pe.numClippingPlanes!==void 0&&(pe.numClippingPlanes!==Ae.numPlanes||pe.numIntersection!==Ae.numIntersection)||pe.vertexAlphas!==Ue||pe.vertexTangents!==Ve||pe.morphTargets!==xe||pe.morphNormals!==Ke||pe.morphColors!==pt||pe.toneMapping!==ot||pe.morphTargetsCount!==Et||!!pe.lightProbeGrid!=w.state.lightProbeGridArray.length>0)&&(je=!0):(je=!0,pe.__version=B.version);let Zt=pe.currentProgram;je===!0&&(Zt=Tr(B,D,z),k&&B.isNodeMaterial&&k.onUpdateProgram(B,Zt,pe));let mn=!1,Vn=!1,Ii=!1,et=Zt.getUniforms(),dt=pe.uniforms;if(_.useProgram(Zt.program)&&(mn=!0,Vn=!0,Ii=!0),B.id!==X&&(X=B.id,Vn=!0),pe.needsLights){let rt=Lf(w.state.lightProbeGridArray,z);pe.lightProbeGrid!==rt&&(pe.lightProbeGrid=rt,Vn=!0)}if(mn||K!==v){_.buffers.depth.getReversed()&&v.reversedDepth!==!0&&(v._reversedDepth=!0,v.updateProjectionMatrix()),et.setValue(U,"projectionMatrix",v.projectionMatrix),et.setValue(U,"viewMatrix",v.matrixWorldInverse);let Hn=et.map.cameraPosition;Hn!==void 0&&Hn.setValue(U,lt.setFromMatrixPosition(v.matrixWorld)),A.logarithmicDepthBuffer&&et.setValue(U,"logDepthBufFC",2/(Math.log(v.far+1)/Math.LN2)),(B.isMeshPhongMaterial||B.isMeshToonMaterial||B.isMeshLambertMaterial||B.isMeshBasicMaterial||B.isMeshStandardMaterial||B.isShaderMaterial)&&et.setValue(U,"isOrthographic",v.isOrthographicCamera===!0),K!==v&&(K=v,Vn=!0,Ii=!0)}if(pe.needsLights&&(Nt.state.sunShadowMap.length>0&&et.setValue(U,"sunShadowMap",Nt.state.sunShadowMap,j),Nt.state.directionalShadowMap.length>0&&et.setValue(U,"directionalShadowMap",Nt.state.directionalShadowMap,j),Nt.state.spotShadowMap.length>0&&et.setValue(U,"spotShadowMap",Nt.state.spotShadowMap,j),Nt.state.pointShadowMap.length>0&&et.setValue(U,"pointShadowMap",Nt.state.pointShadowMap,j)),z.isSkinnedMesh){et.setOptional(U,z,"bindMatrix"),et.setOptional(U,z,"bindMatrixInverse");let rt=z.skeleton;rt&&(rt.boneTexture===null&&rt.computeBoneTexture(),et.setValue(U,"boneTexture",rt.boneTexture,j))}z.isBatchedMesh&&(et.setOptional(U,z,"batchingTexture"),et.setValue(U,"batchingTexture",z._matricesTexture,j),et.setOptional(U,z,"batchingIdTexture"),et.setValue(U,"batchingIdTexture",z._indirectTexture,j),et.setOptional(U,z,"batchingColorTexture"),z._colorsTexture!==null&&et.setValue(U,"batchingColorTexture",z._colorsTexture,j));let Gn=$.morphAttributes;if((Gn.position!==void 0||Gn.normal!==void 0||Gn.color!==void 0)&&N.update(z,$,Zt),(Vn||pe.receiveShadow!==z.receiveShadow)&&(pe.receiveShadow=z.receiveShadow,et.setValue(U,"receiveShadow",z.receiveShadow)),(B.isMeshStandardMaterial||B.isMeshLambertMaterial||B.isMeshPhongMaterial)&&B.envMap===null&&D.environment!==null&&(dt.envMapIntensity.value=D.environmentIntensity),dt.dfgLUT!==void 0&&(dt.dfgLUT.value=ay()),Vn){if(et.setValue(U,"toneMappingExposure",P.toneMappingExposure),pe.needsLights&&Df(dt,Ii),de&&B.fog===!0&&Te.refreshFogUniforms(dt,de),Te.refreshMaterialUniforms(dt,B,te,Y,w.state.transmissionRenderTarget[v.id]),pe.needsLights&&pe.lightProbeGrid){let rt=pe.lightProbeGrid;dt.probesSH.value=rt.texture,dt.probesMin.value.copy(rt.boundingBox.min),dt.probesMax.value.copy(rt.boundingBox.max),dt.probesResolution.value.copy(rt.resolution)}as.upload(U,fh(pe),dt,j)}if(B.isShaderMaterial&&B.uniformsNeedUpdate===!0&&(as.upload(U,fh(pe),dt,j),B.uniformsNeedUpdate=!1),B.isSpriteMaterial&&et.setValue(U,"center",z.center),et.setValue(U,"modelViewMatrix",z.modelViewMatrix),et.setValue(U,"normalMatrix",z.normalMatrix),et.setValue(U,"modelMatrix",z.matrixWorld),B.uniformsGroups!==void 0){let rt=B.uniformsGroups;for(let Hn=0,Li=rt.length;Hn<Li;Hn++){let gh=rt[Hn];ne.update(gh,Zt),ne.bind(gh,Zt)}}return Zt}function Df(v,D){v.ambientLightColor.needsUpdate=D,v.lightProbe.needsUpdate=D,v.sunLights.needsUpdate=D,v.sunLightShadows.needsUpdate=D,v.directionalLights.needsUpdate=D,v.directionalLightShadows.needsUpdate=D,v.pointLights.needsUpdate=D,v.pointLightShadows.needsUpdate=D,v.spotLights.needsUpdate=D,v.spotLightShadows.needsUpdate=D,v.rectAreaLights.needsUpdate=D,v.hemisphereLights.needsUpdate=D}function Nf(v){return v.isMeshLambertMaterial||v.isMeshToonMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isShadowMaterial||v.isShaderMaterial&&v.lights===!0}this.getActiveCubeFace=function(){return H},this.getActiveMipmapLevel=function(){return V},this.getRenderTarget=function(){return q},this.setRenderTargetTextures=function(v,D,$){let B=W.get(v);B.__autoAllocateDepthBuffer=v.resolveDepthBuffer===!1,B.__autoAllocateDepthBuffer===!1&&(B.__useRenderToTexture=!1),W.get(v.texture).__webglTexture=D,W.get(v.depthTexture).__webglTexture=B.__autoAllocateDepthBuffer?void 0:$,B.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(v,D){let $=W.get(v);$.__webglFramebuffer=D,$.__useDefaultFramebuffer=D===void 0},this.setRenderTarget=function(v,D=0,$=0){q=v,H=D,V=$;let B=null,z=!1,de=!1;if(v){let ue=W.get(v);if(ue.__useDefaultFramebuffer!==void 0){_.bindFramebuffer(U.FRAMEBUFFER,ue.__webglFramebuffer),Z.copy(v.viewport),be.copy(v.scissor),ve=v.scissorTest,_.viewport(Z),_.scissor(be),_.setScissorTest(ve),X=-1;return}else if(ue.__webglFramebuffer===void 0)j.setupRenderTarget(v);else if(ue.__hasExternalTextures)j.rebindTextures(v,W.get(v.texture).__webglTexture,W.get(v.depthTexture).__webglTexture);else if(v.depthBuffer){let Ue=v.depthTexture;if(ue.__boundDepthTexture!==Ue){if(Ue!==null&&W.has(Ue)&&(v.width!==Ue.image.width||v.height!==Ue.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");j.setupDepthRenderbuffer(v)}}let ye=v.texture;(ye.isData3DTexture||ye.isDataArrayTexture||ye.isCompressedArrayTexture)&&(de=!0);let we=W.get(v).__webglFramebuffer;v.isWebGLCubeRenderTarget?(Array.isArray(we[D])?B=we[D][$]:B=we[D],z=!0):v.samples>0&&j.useMultisampledRTT(v)===!1?B=W.get(v).__webglMultisampledFramebuffer:Array.isArray(we)?B=we[$]:B=we,Z.copy(v.viewport),be.copy(v.scissor),ve=v.scissorTest}else Z.copy(me).multiplyScalar(te).floor(),be.copy(Be).multiplyScalar(te).floor(),ve=gt;if($!==0&&(B=L),_.bindFramebuffer(U.FRAMEBUFFER,B)&&_.drawBuffers(v,B),_.viewport(Z),_.scissor(be),_.setScissorTest(ve),z){let ue=W.get(v.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_CUBE_MAP_POSITIVE_X+D,ue.__webglTexture,$)}else if(de){let ue=D;for(let ye=0;ye<v.textures.length;ye++){let we=W.get(v.textures[ye]);U.framebufferTextureLayer(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0+ye,we.__webglTexture,$,ue)}}else if(v!==null&&$!==0){let ue=W.get(v.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,ue.__webglTexture,$)}X=-1};function mh(v){let D=W.get(v);return(D.__readFormat!==v.format||D.__readType!==v.type)&&(D.__readFormat=v.format,D.__readType=v.type,D.__formatReadable=A.textureFormatReadable(v.format),D.__typeReadable=A.textureTypeReadable(v.type)),D}this.readRenderTargetPixels=function(v,D,$,B,z,de,ge,ue=0){if(!(v&&v.isWebGLRenderTarget)){Pe("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ye=W.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&ge!==void 0&&(ye=ye[ge]),ye){_.bindFramebuffer(U.FRAMEBUFFER,ye);try{let we=v.textures[ue],Ue=we.format,Ve=we.type;v.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+ue);let xe=mh(we);if(xe.__formatReadable===!1){Pe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(xe.__typeReadable===!1){Pe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}D>=0&&D<=v.width-B&&$>=0&&$<=v.height-z&&U.readPixels(D,$,B,z,ce.convert(Ue),ce.convert(Ve),de)}finally{let we=q!==null?W.get(q).__webglFramebuffer:null;_.bindFramebuffer(U.FRAMEBUFFER,we)}}},this.readRenderTargetPixelsAsync=async function(v,D,$,B,z,de,ge,ue=0){if(!(v&&v.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ye=W.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&ge!==void 0&&(ye=ye[ge]),ye)if(D>=0&&D<=v.width-B&&$>=0&&$<=v.height-z){_.bindFramebuffer(U.FRAMEBUFFER,ye);let we=v.textures[ue],Ue=we.format,Ve=we.type;v.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+ue);let xe=mh(we);if(xe.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(xe.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ke=U.createBuffer();U.bindBuffer(U.PIXEL_PACK_BUFFER,Ke),U.bufferData(U.PIXEL_PACK_BUFFER,de.byteLength,U.STREAM_READ),U.readPixels(D,$,B,z,ce.convert(Ue),ce.convert(Ve),0),U.bindBuffer(U.PIXEL_PACK_BUFFER,null);let pt=q!==null?W.get(q).__webglFramebuffer:null;_.bindFramebuffer(U.FRAMEBUFFER,pt);let ot=U.fenceSync(U.SYNC_GPU_COMMANDS_COMPLETE,0);return U.flush(),await bu(U,ot,4),U.bindBuffer(U.PIXEL_PACK_BUFFER,Ke),U.getBufferSubData(U.PIXEL_PACK_BUFFER,0,de),U.bindBuffer(U.PIXEL_PACK_BUFFER,null),U.deleteBuffer(Ke),U.deleteSync(ot),de}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(v,D=null,$=0){let B=Math.pow(2,-$),z=Math.floor(v.image.width*B),de=Math.floor(v.image.height*B),ge=D!==null?D.x:0,ue=D!==null?D.y:0;j.setTexture2D(v,0),U.copyTexSubImage2D(U.TEXTURE_2D,$,0,0,ge,ue,z,de),_.unbindTexture()},this.copyTextureToTexture=function(v,D,$=null,B=null,z=0,de=0){let ge,ue,ye,we,Ue,Ve,xe,Ke,pt,ot=v.isCompressedTexture?v.mipmaps[de]:v.image;if($!==null)ge=$.max.x-$.min.x,ue=$.max.y-$.min.y,ye=$.isBox3?$.max.z-$.min.z:1,we=$.min.x,Ue=$.min.y,Ve=$.isBox3?$.min.z:0;else{let dt=Math.pow(2,-z);ge=Math.floor(ot.width*dt),ue=Math.floor(ot.height*dt),v.isDataArrayTexture?ye=ot.depth:v.isData3DTexture?ye=Math.floor(ot.depth*dt):ye=1,we=0,Ue=0,Ve=0}B!==null?(xe=B.x,Ke=B.y,pt=B.z):(xe=0,Ke=0,pt=0);let tt=ce.convert(D.format),Et=ce.convert(D.type),pe;D.isData3DTexture?(j.setTexture3D(D,0),pe=U.TEXTURE_3D):D.isDataArrayTexture||D.isCompressedArrayTexture?(j.setTexture2DArray(D,0),pe=U.TEXTURE_2D_ARRAY):(j.setTexture2D(D,0),pe=U.TEXTURE_2D),_.activeTexture(U.TEXTURE0),_.pixelStorei(U.UNPACK_FLIP_Y_WEBGL,D.flipY),_.pixelStorei(U.UNPACK_PREMULTIPLY_ALPHA_WEBGL,D.premultiplyAlpha),_.pixelStorei(U.UNPACK_ALIGNMENT,D.unpackAlignment);let Nt=_.getParameter(U.UNPACK_ROW_LENGTH),je=_.getParameter(U.UNPACK_IMAGE_HEIGHT),Zt=_.getParameter(U.UNPACK_SKIP_PIXELS),mn=_.getParameter(U.UNPACK_SKIP_ROWS),Vn=_.getParameter(U.UNPACK_SKIP_IMAGES);_.pixelStorei(U.UNPACK_ROW_LENGTH,ot.width),_.pixelStorei(U.UNPACK_IMAGE_HEIGHT,ot.height),_.pixelStorei(U.UNPACK_SKIP_PIXELS,we),_.pixelStorei(U.UNPACK_SKIP_ROWS,Ue),_.pixelStorei(U.UNPACK_SKIP_IMAGES,Ve);let Ii=v.isDataArrayTexture||v.isData3DTexture,et=D.isDataArrayTexture||D.isData3DTexture;if(v.isDepthTexture){let dt=W.get(v),Gn=W.get(D),rt=W.get(dt.__renderTarget),Hn=W.get(Gn.__renderTarget);_.bindFramebuffer(U.READ_FRAMEBUFFER,rt.__webglFramebuffer),_.bindFramebuffer(U.DRAW_FRAMEBUFFER,Hn.__webglFramebuffer);for(let Li=0;Li<ye;Li++)Ii&&(U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,W.get(v).__webglTexture,z,Ve+Li),U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,W.get(D).__webglTexture,de,pt+Li)),U.blitFramebuffer(we,Ue,ge,ue,xe,Ke,ge,ue,U.DEPTH_BUFFER_BIT,U.NEAREST);_.bindFramebuffer(U.READ_FRAMEBUFFER,null),_.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else if(z!==0||v.isRenderTargetTexture||W.has(v)){let dt=W.get(v),Gn=W.get(D);_.bindFramebuffer(U.READ_FRAMEBUFFER,C),_.bindFramebuffer(U.DRAW_FRAMEBUFFER,F);for(let rt=0;rt<ye;rt++)Ii?U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,dt.__webglTexture,z,Ve+rt):U.framebufferTexture2D(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,dt.__webglTexture,z),et?U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,Gn.__webglTexture,de,pt+rt):U.framebufferTexture2D(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,Gn.__webglTexture,de),z!==0?U.blitFramebuffer(we,Ue,ge,ue,xe,Ke,ge,ue,U.COLOR_BUFFER_BIT,U.NEAREST):et?U.copyTexSubImage3D(pe,de,xe,Ke,pt+rt,we,Ue,ge,ue):U.copyTexSubImage2D(pe,de,xe,Ke,we,Ue,ge,ue);_.bindFramebuffer(U.READ_FRAMEBUFFER,null),_.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else et?v.isDataTexture||v.isData3DTexture?U.texSubImage3D(pe,de,xe,Ke,pt,ge,ue,ye,tt,Et,ot.data):D.isCompressedArrayTexture?U.compressedTexSubImage3D(pe,de,xe,Ke,pt,ge,ue,ye,tt,ot.data):U.texSubImage3D(pe,de,xe,Ke,pt,ge,ue,ye,tt,Et,ot):v.isDataTexture?U.texSubImage2D(U.TEXTURE_2D,de,xe,Ke,ge,ue,tt,Et,ot.data):v.isCompressedTexture?U.compressedTexSubImage2D(U.TEXTURE_2D,de,xe,Ke,ot.width,ot.height,tt,ot.data):U.texSubImage2D(U.TEXTURE_2D,de,xe,Ke,ge,ue,tt,Et,ot);_.pixelStorei(U.UNPACK_ROW_LENGTH,Nt),_.pixelStorei(U.UNPACK_IMAGE_HEIGHT,je),_.pixelStorei(U.UNPACK_SKIP_PIXELS,Zt),_.pixelStorei(U.UNPACK_SKIP_ROWS,mn),_.pixelStorei(U.UNPACK_SKIP_IMAGES,Vn),de===0&&D.generateMipmaps&&U.generateMipmap(pe),_.unbindTexture()},this.initRenderTarget=function(v){W.get(v).__webglFramebuffer===void 0&&j.setupRenderTarget(v)},this.initTexture=function(v){v.isCubeTexture?j.setTextureCube(v,0):v.isData3DTexture?j.setTexture3D(v,0):v.isDataArrayTexture||v.isCompressedArrayTexture?j.setTexture2DArray(v,0):j.setTexture2D(v,0),_.unbindTexture()},this.resetState=function(){H=0,V=0,q=null,_.reset(),fe.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return cn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=He._getDrawingBufferColorSpace(e),t.unpackColorSpace=He._getUnpackColorSpace()}};function ed(i){let e=atob(i),t=new Uint8Array(e.length);for(let n=0;n<e.length;n++)t[n]=e.charCodeAt(n);return t}function ly(i,e,t){let[n=0,s=0,r=0]=i.size;switch(i.type){case"plane":return new bi(2*Math.min(n||3,6),2*Math.min(s||3,6));case"box":return new Qn(2*n,2*s,2*r);case"cylinder":{let o=new Fs(n,n,2*s,40);return o.rotateX(Math.PI/2),o}case"sphere":return new Os(n,24,16);case"mesh":{if(i.mesh===void 0)return null;let o=t.get(i.mesh);if(o)return o;let a=e[String(i.mesh)];if(!a)return null;let c=new Wt;c.setAttribute("position",new Ft(new Float32Array(ed(a.v).buffer),3));let l=ed(a.f).buffer;return c.setIndex(new Ft(a.f32?new Uint32Array(l):new Uint16Array(l),1)),c.computeVertexNormals(),t.set(i.mesh,c),c}}}var yl=class{constructor(e,t){this.renderer=e;this.canvas=t;this.scene.add(this.world),this.scene.background=new Fe(1316122),this.scene.add(new Gs(16777215,3818066,.9));let n=new Ws(16777215,2.2);n.position.set(1.2,-1,2.6),this.scene.add(n)}scene=new Is;world=new yn;bodies=[];camera=new Pt(55,4/3,.02,30);setScene(e){this.world.clear(),this.bodies=Array.from({length:e.nbody},()=>new yn);for(let n of this.bodies)this.world.add(n);let t=new Map;for(let n of e.geoms){let s=ly(n,e.meshes,t);if(!s)continue;let[r=.5,o=.5,a=.5,c=1]=n.rgba,l=new Bs({color:new Fe(r,o,a),roughness:n.type==="mesh"?.45:.75,metalness:n.type==="mesh"?.08:0,transparent:c<1,opacity:c,side:n.type==="plane"?en:Sn}),h=new Xt(s,l);h.position.set(n.pos[0],n.pos[1],n.pos[2]),h.quaternion.set(n.quat[1],n.quat[2],n.quat[3],n.quat[0]),this.bodies[n.body]?.add(h)}this.updatePoses(Float32Array.from(e.poses.flat()))}updatePoses(e){for(let t=0;t<this.bodies.length;t++){let n=7*t;if(n+6>=e.length)break;this.bodies[t].position.set(e[n],e[n+1],e[n+2]),this.bodies[t].quaternion.set(e[n+4],e[n+5],e[n+6],e[n+3])}}async render(e,t){let{width:n,height:s}=t;this.renderer.setSize(n,s,!1);let r=e.T_world_cam,o=new ct().set(r[0],r[1],r[2],r[3],r[4],r[5],r[6],r[7],r[8],r[9],r[10],r[11],0,0,0,1);this.camera.position.setFromMatrixPosition(o),this.camera.quaternion.setFromRotationMatrix(o),this.camera.fov=2*Math.atan(.5*e.height/e.fy)*180/Math.PI,this.camera.aspect=n/s,this.camera.updateProjectionMatrix(),this.camera.updateMatrixWorld(!0),this.renderer.render(this.scene,this.camera);let a=await this.canvas.convertToBlob({type:t.mime,quality:t.quality});return new Uint8Array(await a.arrayBuffer())}};function td(){try{if(typeof OffscreenCanvas>"u")return null;let i=new OffscreenCanvas(480,360),e=new ba({canvas:i,antialias:!0,preserveDrawingBuffer:!0});return e.outputColorSpace=Ut,new yl(e,i)}catch{return null}}var id={franka:{dir:"franka_emika_panda",xml:"panda.xml"},so101:{dir:"robotstudio_so101",xml:"so101.xml"}};function sd(i="/dooms"){let e=async t=>{let n=await fetch(`${i}/${t}`);if(!n.ok)throw new Error(`Could not load ${t} (HTTP ${n.status})`);return n};return{text:async t=>(await e(t)).text(),bytes:async t=>new Uint8Array(await(await e(t)).arrayBuffer())}}var xl=null;function rd(i={}){return xl??=(async()=>{let e=i.factory,t=i.url??"/vendor/mujoco/mujoco.js";e||(e=(await import(t)).default);let n=!i.factory&&typeof self<"u"&&"location"in self;return await e(n?{locateFile:s=>new URL(s,new URL(t,self.location.href)).href}:void 0)})().catch(e=>{throw xl=null,e}),xl}var nd=new Set,bl=new Map;function hy(i,e){let t="";for(let n of e.split("/").filter(Boolean))t+=`/${n}`,i.FS.analyzePath(t).exists||i.FS.mkdir(t)}async function od(i,e,t){let n=id[t];if(!n)throw new Error(`unknown robot '${t}'`);let s=await e.text(`${n.dir}/${n.xml}`);if(nd.has(t))return s;let r=bl.get(t);return r||(r=(async()=>{let o=Array.from(new Set(Array.from(s.matchAll(/file="([^"]+)"/g),c=>c[1])));hy(i,`/dooms/${n.dir}/assets`);let a=8;for(let c=0;c<o.length;c+=a)await Promise.all(o.slice(c,c+a).map(async l=>i.FS.writeFile(`/dooms/${n.dir}/assets/${l}`,await e.bytes(`${n.dir}/assets/${l}`))));nd.add(t)})().finally(()=>bl.delete(t)),bl.set(t,r)),await r,s}var uy=0;function ad(i,e,t){let s=`/dooms/${id[e].dir}/model_${uy++%4}.xml`;return i.FS.writeFile(s,t),i.MjModel.from_xml_path(s)}dr();var By=[["cube_red",/\bred\b(?:\s+(?:cube|block))?|\bred\s+one\b/],["cube_blue",/\bblue\b(?:\s+(?:cube|block))?|\bblue\s+one\b/],["bottle",/\bbottle\b/],["box",/\b(?:box|tray|bin)\b/]],zy=/\b(?:outside(?: of)?|out of|beside|next to|away from|on the table|on the free|free (?:spot|space))\b/;function Vy(i,e){let t=new Set(e.objects.map(o=>o.name)),n=i.toLowerCase(),s=[];for(let[o,a]of By){if(!t.has(o))continue;let c=a.exec(n);c&&s.push([c.index,o])}let r=s.sort((o,a)=>o[0]-a[0]).map(([,o])=>o);if(zy.test(n)){let o=r.filter(a=>a!=="box");return o.length?[o[0],"table"]:null}return r.length<2||r[0]==="box"?null:[r[0],r[1]]}function Gy(i,e){return e==="table"?{type:"outside",object:i,target:"box"}:{type:e==="box"?"inside":"on_top",object:i,target:e}}function Dd(i,e){let t=Vy(e,i),n={...i,instruction:e};return!i.success.length&&t&&(n.success=[Gy(t[0],t[1])]),{task:n,pair:t}}var Hy={bottle_r:.022,bottle_half_h:.07,cap_r:.012,cap_half_h:.016,tray_half:.09,tray_floor:.012,tray_wall_t:.008,tray_wall_half_h:.025,cube:.04},Wy=i=>2*(i.bottle_half_h+i.cap_half_h),Ud=i=>i.bottle_half_h+2*i.cap_half_h,Fd={sim:{timestep:.002,control_hz:50,settle_seconds:.6,cameras:{scene:{pos:[.95,-.55,.8],lookat:[.45,0,.06],fovy:55,width:640,height:480},wrist:{fovy:75,width:320,height:240}}},execution:{max_subtask_seconds:10,max_lin_speed:.3,max_ang_speed:1.2,pos_gain:5,ang_gain:4,pos_tol:.006,ang_tol:.05,damping:.02,force_approach_speed:.04},pipeline:{grounding:"vlm",refine_iters:1,skill_library_dir:null,wrist_refine:!0,obstacle_check:!0,max_obstacle_rounds:2,max_regrounds:2,max_subtask_retries:0,max_replans:1,record_video:!0,video_fps:20}};function Ia(i,e){let t=structuredClone(i);for(let[n,s]of Object.entries(e??{})){let r=t[n];s&&typeof s=="object"&&!Array.isArray(s)&&r&&typeof r=="object"&&!Array.isArray(r)?t[n]=Ia(r,s):t[n]=s}return t}var Dl={id:"franka",label:"Franka Panda",dof:7,max_width:.08,grasp_min_width:.008,force_sensor:!0,dims:Hy,scenes:["sandbox","sandbox_fallen","sandbox_blocked","put_bottle_in_box","put_cube_in_box","stack_cubes"],table_center:[.45,0],table_half:[.6,.65],remap:null,max_radius:null,min_separation:null,scene_cam:{pos:[.95,-.55,.8],lookat:[.45,0,.06],fovy:55},view:{pos:[1.62,-1.15,1.2],target:[.42,.02,.1]},finger:{center:.052,length:.03,width:.034,max_z:.15},exec:{},pipeline:{}},Xy={id:"so101",label:"SO-ARM101",dof:5,max_width:.055,grasp_min_width:.011,force_sensor:!1,dims:{bottle_r:.013,bottle_half_h:.017,cap_r:.007,cap_half_h:.006,tray_half:.055,tray_floor:.006,tray_wall_t:.005,tray_wall_half_h:.009,cube:.025},scenes:["sandbox","put_bottle_in_box","put_cube_in_box","stack_cubes"],table_center:[.2,0],table_half:[.42,.42],remap:[.205,.5,.5],max_radius:.27,min_separation:.092,scene_cam:{pos:[.48,-.36,.34],lookat:[.17,0,.01],fovy:55},view:{pos:[.72,-.58,.46],target:[.15,0,.03],scale:.45},finger:{center:.03,length:.02,width:.02,max_z:.06},exec:{max_lin_speed:.12,max_ang_speed:1,pos_tol:.0025,force_approach_speed:.02},pipeline:{wrist_refine:!1}},kl={franka:Dl,so101:Xy},_s="franka";function gr(i){let e=kl[i||_s];if(!e)throw new Error(`unknown robot '${i}' (choose from ${Object.keys(kl).sort().join(", ")})`);return e}var Nl=(i,e)=>i.scenes.includes(e);var wt=i=>({yaw_range:[0,0],color:[.5,.5,.5],size:.04,lying:!1,...i}),Ca=[.45,.7,.95],fr=[.22,.22,.24],pr=[.85,.15,.15],Pa=[.15,.3,.9],Ll="the top of the bottle's small cap (a top-down grasp point only while the bottle STANDS upright; on a bottle lying on its side this surface faces sideways)",mr="centre of the box's interior floor",Nd='Objects on the table: a water bottle (about 0.17 m long and 0.045 m wide, with a narrow cap end about 0.03 m long and 0.024 m wide), a red cube and a blue cube (0.04 m on each side), and an open tray called "the box" (about 0.18 m x 0.18 m, 0.05 m tall walls).',gs="Robot base is at the world origin, x forward, z up, table top at z=0.",$y=[{name:"put_bottle_in_box",instruction:"put the bottle into the box",objects:[wt({name:"bottle",type:"bottle",x_range:[.42,.56],y_range:[.08,.24],color:Ca}),wt({name:"box",type:"tray",x_range:[.4,.55],y_range:[-.3,-.14],color:fr})],keypoints:{bottle_cap:Ll,box_inside:mr},scene_context:`${gs} The bottle is a water bottle about 0.17 m long and 0.045 m wide, with a narrow cap end about 0.03 m long and 0.024 m wide. The box is an open tray about 0.18 m x 0.18 m with 0.05 m tall walls. The parallel gripper opens to at most 0.08 m.`,success:[{type:"inside",object:"bottle",target:"box"}],min_object_separation:.16,seed_variation:!0},{name:"put_cube_in_box",instruction:"put the red cube into the box",objects:[wt({name:"cube_red",type:"cube",x_range:[.42,.56],y_range:[.08,.24],yaw_range:[-.4,.4],color:pr,size:.04}),wt({name:"box",type:"tray",x_range:[.4,.55],y_range:[-.3,-.14],color:fr})],keypoints:{cube_red_top:"centre of the top face of the red cube",box_inside:mr},scene_context:`${gs} The red cube is 0.04 m on each side. The box is an open tray about 0.18 m x 0.18 m with 0.05 m tall walls. The parallel gripper opens to at most 0.08 m.`,success:[{type:"inside",object:"cube_red",target:"box"}],min_object_separation:.16,seed_variation:!0},{name:"sandbox",instruction:"put the bottle into the box",objects:[wt({name:"bottle",type:"bottle",x_range:[.48,.58],y_range:[.14,.26],color:Ca}),wt({name:"cube_red",type:"cube",x_range:[.32,.42],y_range:[.1,.22],yaw_range:[-.4,.4],color:pr,size:.04}),wt({name:"cube_blue",type:"cube",x_range:[.32,.42],y_range:[-.1,.02],yaw_range:[-.4,.4],color:Pa,size:.04}),wt({name:"box",type:"tray",x_range:[.46,.56],y_range:[-.3,-.19],color:fr})],keypoints:{bottle_cap:Ll,box_inside:mr,cube_red_top:"centre of the top face of the red cube",cube_blue_top:"centre of the top face of the blue cube"},scene_context:`${gs} ${Nd} The parallel gripper opens to at most 0.08 m.`,success:[],min_object_separation:.11,seed_variation:!0},{name:"sandbox_blocked",instruction:"pick up the bottle and put it on the table",objects:[wt({name:"bottle",type:"bottle",lying:!0,x_range:[.5,.5],y_range:[.1,.1],yaw_range:[1.5708,1.5708],color:Ca}),wt({name:"box",type:"tray",x_range:[.5,.5],y_range:[.23,.23],color:fr}),wt({name:"cube_red",type:"cube",x_range:[.34,.34],y_range:[-.14,-.14],color:pr,size:.04}),wt({name:"cube_blue",type:"cube",x_range:[.34,.34],y_range:[-.28,-.28],color:Pa,size:.04})],keypoints:{bottle_body_center:"the middle of the bottle's body, on its top surface",box_inside:mr,cube_red_top:"centre of the top face of the red cube",cube_blue_top:"centre of the top face of the blue cube"},scene_context:`${gs} Objects on the table: a water bottle (about 0.17 m long and 0.045 m wide), a red cube and a blue cube (0.04 m on each side), and an open tray called "the box" (about 0.18 m x 0.18 m, 0.05 m tall walls, about 0.65 kg, it slides when pushed). The parallel gripper opens to at most 0.08 m; its fingers need about 6 cm of free space on each side of whatever it grasps. The robot can reach the middle of the table in front of it (x 0.3 to 0.65 m, y -0.35 to 0.35 m).`,success:[],min_object_separation:.05,seed_variation:!0},{name:"sandbox_fallen",instruction:"put the bottle into the box",objects:[wt({name:"bottle",type:"bottle",lying:!0,x_range:[.46,.56],y_range:[.1,.22],yaw_range:[-1.2,1.2],color:Ca}),wt({name:"cube_red",type:"cube",x_range:[.32,.42],y_range:[.1,.22],yaw_range:[-.4,.4],color:pr,size:.04}),wt({name:"cube_blue",type:"cube",x_range:[.32,.42],y_range:[-.1,.02],yaw_range:[-.4,.4],color:Pa,size:.04}),wt({name:"box",type:"tray",x_range:[.46,.56],y_range:[-.3,-.19],color:fr})],keypoints:{bottle_cap:Ll,box_inside:mr,cube_red_top:"centre of the top face of the red cube",cube_blue_top:"centre of the top face of the blue cube"},scene_context:`${gs} ${Nd} The parallel gripper opens to at most 0.08 m.`,success:[],min_object_separation:.11,seed_variation:!0},{name:"stack_cubes",instruction:"stack the red cube on top of the blue cube",objects:[wt({name:"cube_red",type:"cube",x_range:[.42,.56],y_range:[.1,.25],yaw_range:[-.4,.4],color:pr,size:.04}),wt({name:"cube_blue",type:"cube",x_range:[.42,.56],y_range:[-.25,-.1],yaw_range:[-.4,.4],color:Pa,size:.04})],keypoints:{cube_red_top:"centre of the top face of the red cube",cube_blue_top:"centre of the top face of the blue cube"},scene_context:`${gs} Both cubes are 0.04 m on each side. The parallel gripper opens to at most 0.08 m.`,success:[{type:"on_top",object:"cube_red",target:"cube_blue"}],min_object_separation:.16,seed_variation:!0}],_r=Object.fromEntries($y.map(i=>[i.name,i])),jy=["sandbox","sandbox_fallen","sandbox_blocked",...Object.keys(_r).filter(i=>!i.startsWith("sandbox")).sort()];function Ul(i){let e=_r[i];if(!e)throw new Error(`unknown scene '${i}'`);return structuredClone(e)}function Fl(i,e){if(!e.remap)return i;let[t,n,s]=e.remap,r=e.dims,o=i.objects.map(a=>{let c=[t+(a.x_range[0]-.45)*n,t+(a.x_range[1]-.45)*n],l=[a.y_range[0]*s,a.y_range[1]*s];if(e.max_radius){let h=Math.max(Math.abs(l[0]),Math.abs(l[1])),d=Math.sqrt(Math.max(e.max_radius**2-h**2,0));c[1]>d&&(c=[Math.min(c[0],d),d])}return{...a,x_range:c,y_range:l,...a.type==="cube"?{size:r.cube}:{}}});return{...i,objects:o,scene_context:qy(i,e),min_object_separation:e.min_separation||i.min_object_separation}}function qy(i,e){let t=e.dims,n=c=>`${(c*100).toFixed(1)} cm`,s=["Robot base is at the world origin, x forward, z up, table top at z=0."],r=[],o=new Set(i.objects.map(c=>c.type));o.has("bottle")&&r.push(`a small bottle (${n(Wy(t))} tall and ${n(2*t.bottle_r)} wide, with a narrow cap on top ${n(2*t.cap_half_h)} tall and ${n(2*t.cap_r)} wide)`);let a=i.objects.filter(c=>c.type==="cube");if(a.length){let c=a.length>1?a.map(l=>`${l.name.replace("cube_","")} cube`).join(" and "):a[0].name!=="cube"?`a ${a[0].name.replace("cube_","")} cube`:"a cube";r.push(`${c} (${n(t.cube)} on each side)`)}return o.has("tray")&&r.push(`an open tray called "the box" (${n(2*t.tray_half)} x ${n(2*t.tray_half)}, ${n(t.tray_floor+2*t.tray_wall_half_h)} tall walls, light enough to slide when pushed)`),r.length&&s.push("Objects on the table: "+r.join(", ")+"."),s.push(`The gripper opens to at most ${(e.max_width*100).toFixed(1)} cm.`),s.join(" ")}var Od=(i,e)=>Ia(i,{robot:e.id,execution:{...e.exec},pipeline:{...e.pipeline}});Un();var Bd=(BigInt(1)<<BigInt(64))-BigInt(1),Ol=(BigInt(1)<<BigInt(128))-BigInt(1),An=BigInt("0xffffffff"),Yy=BigInt("0x43b0d7e5"),Jy=BigInt("0x931e8875"),Ky=BigInt("0x8b51f9dd"),Zy=BigInt("0x58f38ded"),Qy=BigInt("0xca01f9dd"),ex=BigInt("0x4973f715"),zl=BigInt(16);function Bl(i,e){return i=(i^e.v)&An,e.v=e.v*Jy&An,i=i*e.v&An,i=(i^i>>zl)&An,i}var zd=(i,e)=>{let t=Qy*i-ex*e&An;return t=(t^t>>zl)&An,t};function tx(i,e){let t=BigInt(i),n=[];for(t===BigInt(0)&&n.push(BigInt(0));t>BigInt(0);)n.push(t&An),t>>=BigInt(32);let s=4;for(;n.length<s;)n.push(BigInt(0));let r={v:Yy},o=[];for(let l=0;l<s;l++)o.push(Bl(n[l],r));for(let l=0;l<s;l++)for(let h=0;h<s;h++)l!==h&&(o[h]=zd(o[h],Bl(o[l],r)));for(let l=s;l<n.length;l++)for(let h=0;h<s;h++)o[h]=zd(o[h],Bl(n[l],r));let a=[],c={v:Ky};for(let l=0;l<e;l++){let h=o[l%s]^c.v;c.v=c.v*Zy&An,h=h*c.v&An,h=(h^h>>zl)&An,a.push(h)}return a}var nx=(BigInt("2549297995355413924")<<BigInt(64))+BigInt("4865540595714422341"),La=class{state;inc;constructor(e){let t=tx(e,8),n=o=>t[2*o]|t[2*o+1]<<BigInt(32),s=n(0)<<BigInt(64)|n(1),r=n(2)<<BigInt(64)|n(3);this.inc=(r<<BigInt(1)|BigInt(1))&Ol,this.state=BigInt(0),this.step(),this.state=this.state+s&Ol,this.step()}step(){this.state=this.state*nx+this.inc&Ol}nextUint64(){this.step();let e=this.state>>BigInt(64),t=this.state&Bd,n=e^t,s=e>>BigInt(58);return(n>>s|n<<(BigInt(64)-s&BigInt(63)))&Bd}random(){return Number(this.nextUint64()>>BigInt(11))/9007199254740992}uniform(e,t){return e+(t-e)*this.random()}};Un();var ix=.1025,sx=[.011,0,-.088],rx=[0,1,0,1,0,0,0,0,-1],Ne=i=>String(i),ka=i=>Array.from(i,Ne).join(" "),Vl=(i,e=1)=>`${Ne(i[0])} ${Ne(i[1])} ${Ne(i[2])} ${Ne(e)}`;function ox(i,e){let t=fn(ld(i,e)),n=fn(ai([0,0,1],t)),s=ai(t,n);return vl([n[0],s[0],t[0],n[1],s[1],t[1],n[2],s[2],t[2]])}function ax(i,e){return`<body name="${i.name}" pos="0.5 0.15 ${Ne(e.bottle_half_h+.002)}">
  <freejoint name="${i.name}_free"/>
  <geom name="${i.name}_body" type="cylinder" size="${Ne(e.bottle_r)} ${Ne(e.bottle_half_h)} 0" rgba="${Vl(i.color)}" mass="0.04" friction="0.4 0.01 0.001" condim="4"/>
  <geom name="${i.name}_cap_geom" type="cylinder" size="${Ne(e.cap_r)} ${Ne(e.cap_half_h)} 0" pos="0 0 ${Ne(e.bottle_half_h+e.cap_half_h)}" rgba="0.1 0.25 0.85 1" mass="0.005" friction="1.5 0.01 0.001" condim="4"/>
  <site name="bottle_cap" pos="0 0 ${Ne(Ud(e))}" size="0.003 0 0" group="4"/>
</body>`}function cx(i,e){let t=e.tray_half,n=Vl(i.color),s=e.tray_floor+e.tray_wall_half_h,r=e.tray_wall_t,o=[[t,r,0,t-r],[t,r,0,-(t-r)],[r,t,t-r,0],[r,t,-(t-r),0]];return`<body name="${i.name}" pos="0.5 -0.2 0.001">
  <freejoint name="${i.name}_free"/>
  <geom name="${i.name}_floor" type="box" size="${Ne(t)} ${Ne(t)} ${Ne(e.tray_floor/2)}" mass="0.25" pos="0 0 ${Ne(e.tray_floor/2)}" rgba="${n}" friction="0.5 0.005 0.0001"/>
${o.map(([a,c,l,h],d)=>`  <geom name="${i.name}_wall${d}" type="box" size="${Ne(a)} ${Ne(c)} ${Ne(e.tray_wall_half_h)}" mass="0.1" pos="${Ne(l)} ${Ne(h)} ${Ne(s)}" rgba="${n}" friction="0.5 0.005 0.0001"/>`).join(`
`)}
  <site name="box_inside" pos="0 0 ${Ne(e.tray_floor)}" size="0.003 0 0" group="4"/>
</body>`}function lx(i){let e=i.size/2;return`<body name="${i.name}" pos="0.5 0.15 ${Ne(e+.002)}">
  <freejoint name="${i.name}_free"/>
  <geom name="${i.name}_geom" type="box" size="${Ne(e)} ${Ne(e)} ${Ne(e)}" rgba="${Vl(i.color)}" mass="0.05" friction="1.5 0.01 0.001" condim="4"/>
  <site name="${i.name}_top" pos="0 0 ${Ne(e)}" size="0.003 0 0" group="4"/>
</body>`}function Vd(i,e,t,n){let s=n.id==="so101",r=i,o=Ne(t.sim.timestep);s?r=r.replace(/timestep="[^"]*"/,`timestep="${o}"`):r=r.replace('<option integrator="implicitfast"/>',`<option integrator="implicitfast" timestep="${o}"/>`);let[a,c]=n.table_center,[l,h]=n.table_half,d=[`<light pos="${Ne(a)} 0 2" dir="0 0 -1" diffuse="0.4 0.4 0.4" castshadow="false"/>`,'<geom name="floor" type="plane" size="3 3 0.05" pos="0 0 -0.04" rgba="0.12 0.13 0.15 1"/>',`<geom name="table" type="box" size="${Ne(l)} ${Ne(h)} 0.02" pos="${Ne(a)} ${Ne(c)} -0.02" rgba="0.62 0.62 0.6 1" friction="0.5 0.005 0.0001"/>`];for(let b of e.objects)d.push(b.type==="bottle"?ax(b,n.dims):b.type==="tray"?cx(b,n.dims):lx(b));let u={...t.sim.cameras.scene,...n.scene_cam};d.push(`<camera name="scene_cam" pos="${ka(u.pos)}" quat="${ka(ox(u.pos,u.lookat))}" fovy="${Ne(u.fovy)}"/>`);let f,g;if(s)f=/<body name="gripper"[^>]*>/,g=`<site name="tcp" pos="${ka(sx)}" quat="${ka(vl(rx))}" size="0.004 0 0" group="4"/>`;else{if(r=r.replace(/(<general class="panda" name="actuator8"[^>]*?)gainprm="[^"]*" biasprm="[^"]*"/,`$1gainprm="${Ne(.01568627451*5)} 0 0" biasprm="0 ${Ne(-500)} ${Ne(-30)}"`),!r.includes(`gainprm="${Ne(.01568627451*5)} 0 0"`))throw new Error("could not patch the Franka gripper actuator");f=/<body name="hand"[^>]*>/,g=[`<site name="tcp" pos="0 0 ${Ne(ix)}" size="0.004 0 0" group="4"/>`,'<site name="ft" pos="0 0 0" size="0.004 0 0" group="4"/>',`<camera name="wrist_cam" pos="0 0 0.06" quat="0 1 0 0" fovy="${Ne(t.sim.cameras.wrist.fovy)}"/>`].join(`
`),r=r.replace("</mujoco>",`<sensor>
<force name="wrist_force" site="ft"/>
<torque name="wrist_torque" site="ft"/>
</sensor>
</mujoco>`)}if(!f.test(r))throw new Error("hand body not found in the robot MJCF");return r=r.replace(f,b=>`${b}
${g}`),r=r.replace("</worldbody>",`${d.join(`
`)}
</worldbody>`),r}var hx={0:"plane",6:"box",5:"cylinder",2:"sphere",7:"mesh"},ux=2;function Gd(i){let e="";for(let t=0;t<i.length;t+=32768)e+=String.fromCharCode(...i.subarray(t,t+32768));return btoa(e)}var Da=(i,e)=>Math.round(i*10**e)/10**e;function dx(i,e){let t=i.mesh_vertadr[e],n=i.mesh_vertnum[e],s=i.mesh_faceadr[e],r=i.mesh_facenum[e],o=i.mesh_vert,a=new Map,c=new Int32Array(n),l=[];for(let f=0;f<n;f++){let g=o[(t+f)*3],b=o[(t+f)*3+1],m=o[(t+f)*3+2],p=`${Math.round(g*1e6)},${Math.round(b*1e6)},${Math.round(m*1e6)}`,x=a.get(p);x===void 0&&(x=l.length/3,a.set(p,x),l.push(g,b,m)),c[f]=x}let h=new Uint32Array(r*3);for(let f=0;f<r*3;f++)h[f]=c[i.mesh_face[s*3+f]];let d=l.length/3>=65535,u=d?h:Uint16Array.from(h);return{v:Gd(new Uint8Array(Float32Array.from(l).buffer)),f:Gd(new Uint8Array(u.buffer)),f32:d}}function Na(i,e){let t=new Float32Array(i.nbody*7),n=e.xpos,s=e.xquat;for(let r=0;r<i.nbody;r++)t[r*7]=n[r*3],t[r*7+1]=n[r*3+1],t[r*7+2]=n[r*3+2],t[r*7+3]=s[r*4],t[r*7+4]=s[r*4+1],t[r*7+5]=s[r*4+2],t[r*7+6]=s[r*4+3];return t}function Gl(i,e){let t=[],n={};for(let r=0;r<i.ngeom;r++){if(i.geom_group[r]>ux)continue;let o=hx[i.geom_type[r]];if(!o)continue;let a=i.geom_matid[r],c=i.geom_rgba.subarray(r*4,r*4+4),l=a>=0?i.mat_rgba.subarray(a*4,a*4+4):c;a>=0&&c[3]<1&&(l=c);let h={body:i.geom_bodyid[r],type:o,size:Array.from(i.geom_size.subarray(r*3,r*3+3),d=>Da(d,5)),pos:Array.from(i.geom_pos.subarray(r*3,r*3+3),d=>Da(d,5)),quat:Array.from(i.geom_quat.subarray(r*4,r*4+4),d=>Da(d,6)),rgba:Array.from(l,d=>Da(d,3))};if(o==="mesh"){let d=i.geom_dataid[r];h.mesh=d,String(d)in n||(n[String(d)]=dx(i,d))}t.push(h)}let s=Na(i,e);return{nbody:i.nbody,geoms:t,meshes:n,poses:Array.from({length:i.nbody},(r,o)=>Array.from(s.subarray(o*7,o*7+7)))}}var fx={franka:[1,2,3,4,5,6,7].map(i=>`joint${i}`),so101:["shoulder_pan","shoulder_lift","elbow_flex","wrist_flex","wrist_roll"]},Hl=255,px=[0,-.59,.45,1.55,0],mx=-.0115,gx=(i,e,t,n,s)=>{let r=.5*t/Math.tan(n*Math.PI/360);return{name:i,width:e,height:t,fx:r,fy:r,cx:(e-1)/2,cy:(t-1)/2,T_world_cam:s}};var Ua=class i{profile;dims;max_width;force_sensor;task;cfg;model;data;n_joints;control_dt;q_home;poseSink=null;frameSink=null;pace=null;frameEvery;pushHint={};imageProvider=null;mj;so;jid;qadr;dadr;hand;tcp;jaw=-1;jawAdr=-1;ft=-1;fq=[];forceAdr=-1;torqueAdr=-1;jawTheta=[];jawWidth=[];lo;hi;substeps;qDes;gripCtrl;tick=0;jacP;jacR;constructor(e,t,n,s,r){this.mj=e,this.profile=r,this.dims=r.dims,this.max_width=r.max_width,this.force_sensor=r.force_sensor,this.task=Fl(n,r),this.cfg=s,this.model=t,this.data=new e.MjData(t);let o=this.so=r.id==="so101",a=(c,l)=>{let h=e.mj_name2id(t,e.mjtObj[c].value,l);if(h<0)throw new Error(`model has no ${c} '${l}'`);return h};this.n_joints=r.dof,this.jid=fx[r.id].map(c=>a("mjOBJ_JOINT",c)),this.qadr=this.jid.map(c=>t.jnt_qposadr[c]),this.dadr=this.jid.map(c=>t.jnt_dofadr[c]),this.hand=a("mjOBJ_BODY",o?"gripper":"hand"),this.tcp=a("mjOBJ_SITE","tcp"),o?(this.jaw=a("mjOBJ_JOINT","gripper"),this.jawAdr=t.jnt_qposadr[this.jaw],this.buildJawTable(e,a("mjOBJ_GEOM","moving_jaw_sph_tip1"))):(this.fq=["finger_joint1","finger_joint2"].map(c=>t.jnt_qposadr[a("mjOBJ_JOINT",c)]),this.ft=a("mjOBJ_SITE","ft"),this.forceAdr=t.sensor_adr[a("mjOBJ_SENSOR","wrist_force")],this.torqueAdr=t.sensor_adr[a("mjOBJ_SENSOR","wrist_torque")]),this.lo=this.jid.map(c=>t.jnt_range[c*2]),this.hi=this.jid.map(c=>t.jnt_range[c*2+1]),this.control_dt=1/s.sim.control_hz,this.substeps=Math.max(1,Math.round(this.control_dt/t.opt.timestep)),this.qDes=new Array(this.n_joints).fill(0),this.gripCtrl=o?this.widthToJaw(this.max_width):Hl,this.frameEvery=Math.max(1,Math.round(s.sim.control_hz/(s.pipeline.video_fps??20))),this.q_home=o?[...px]:Array.from(t.key_qpos.subarray(0,7)),this.jacP=e.DoubleBuffer.FromArray(new Float64Array(3*t.nv)),this.jacR=e.DoubleBuffer.FromArray(new Float64Array(3*t.nv))}static async create(e,t,n,s,r){let o=typeof r=="object"&&r?r:gr(r),a=Fl(n,o),c=await od(e,t,o.id),l=ad(e,o.id,Vd(c,a,s,o));return new i(e,l,n,s,o)}buildJawTable(e,t){let n=this.model,s=new e.MjData(n),r=n.jnt_range[this.jaw*2],o=n.jnt_range[this.jaw*2+1],a=181,c=-1/0;for(let l=0;l<a;l++){let h=r+(o-r)*l/(a-1);s.qpos[this.jawAdr]=h,e.mj_kinematics(n,s);let d=s.xmat.subarray(this.hand*9,this.hand*9+9),u=[0,1,2].map(g=>s.geom_xpos[t*3+g]-s.xpos[this.hand*3+g]),f=Ti(d,u);c=Math.max(c,f[0]-mx),this.jawTheta.push(h),this.jawWidth.push(c)}s.delete()}interp(e,t,n){if(e<=t[0])return n[0];if(e>=t[t.length-1])return n[n.length-1];let s=0,r=t.length-1;for(;r-s>1;){let a=s+r>>1;t[a]<=e?s=a:r=a}let o=(e-t[s])/(t[r]-t[s]);return n[s]+o*(n[r]-n[s])}widthToJaw(e){return this.interp(Math.min(Math.max(e,this.jawWidth[0]),this.max_width),this.jawWidth,this.jawTheta)}gripperWidth(){if(this.so)return this.interp(this.data.qpos[this.jawAdr],this.jawTheta,this.jawWidth);let e=this.data.qpos;return e[this.fq[0]]+e[this.fq[1]]}reset(e){let t=this.model,n=this.data,s=this.mj,r=new La(e);this.so?(s.mj_resetData(t,n),this.qadr.forEach((c,l)=>n.qpos[c]=this.q_home[l]),n.qpos[this.jawAdr]=this.widthToJaw(this.max_width)):s.mj_resetDataKeyframe(t,n,s.mj_name2id(t,s.mjtObj.mjOBJ_KEY.value,"home"));let o=[];for(let c of this.task.objects){let l=0,h=0;for(let m=0;m<200&&(l=r.uniform(c.x_range[0],c.x_range[1]),h=r.uniform(c.y_range[0],c.y_range[1]),!o.every(([p,x])=>Math.hypot(l-p,h-x)>=this.task.min_object_separation));m++);o.push([l,h]);let d=r.uniform(c.yaw_range[0],c.yaw_range[1]),u=[Math.cos(d/2),0,0,Math.sin(d/2)],f=s.mj_name2id(t,s.mjtObj.mjOBJ_BODY.value,c.name),g=t.jnt_qposadr[s.mj_name2id(t,s.mjtObj.mjOBJ_JOINT.value,`${c.name}_free`)],b=t.body_pos[f*3+2];if(c.type==="bottle"&&c.lying){let m=[Math.cos(Math.PI/4),Math.sin(Math.PI/4),0,0];u=dd([Math.cos(d/2),0,0,Math.sin(d/2)],m),b=this.dims.bottle_r+.002}n.qpos.set([l,h,b,...u],g)}s.mj_forward(t,n),this.qDes=[...this.q_home],this.gripCtrl=this.so?this.widthToJaw(this.max_width):Hl,this.pushHint={},this.tick=0,this.applyCtrl();let a=Math.trunc(this.cfg.sim.settle_seconds/t.opt.timestep);for(let c=0;c<a;c++)s.mj_step(t,n)}state(){let e=this.data,t=[0,0,0,0,0,0];if(this.force_sensor){let r=e.site_xmat.subarray(this.ft*9,this.ft*9+9),o=ls(r,e.sensordata.subarray(this.forceAdr,this.forceAdr+3)),a=ls(r,e.sensordata.subarray(this.torqueAdr,this.torqueAdr+3));t.splice(0,6,...o,...a)}let n=e.qpos,s=e.qvel;return{q:this.qadr.map(r=>n[r]),dq:this.dadr.map(r=>s[r]),tcp_pos:Array.from(e.site_xpos.subarray(this.tcp*3,this.tcp*3+3)),tcp_rot:Array.from(e.site_xmat.subarray(this.tcp*9,this.tcp*9+9)),gripper_width:this.gripperWidth(),wrench:t,t:e.time}}jacobian(e){let t=this.model.nv;this.mj.mj_jac(this.model,this.data,this.jacP,this.jacR,Float64Array.from(e),this.hand);let n=this.jacP.GetView(),s=this.jacR.GetView(),r=this.n_joints,o=new kt(3,r),a=new kt(3,r);for(let c=0;c<3;c++)for(let l=0;l<r;l++)o.data[c*r+l]=n[c*t+this.dadr[l]],a.data[c*r+l]=s[c*t+this.dadr[l]];return[o,a]}jointLimits(){return[this.lo,this.hi]}setJointTargets(e){this.qDes=this.qDes.map((t,n)=>Math.min(Math.max(e[n],this.lo[n]),this.hi[n]))}setGripper(e){this.so?this.gripCtrl=this.widthToJaw(e):this.gripCtrl=Math.min(Math.max(e/this.max_width,0),1)*Hl}applyCtrl(){let e=this.data.ctrl;for(let t=0;t<this.n_joints;t++)e[t]=this.qDes[t];e[this.n_joints]=this.gripCtrl}step(){this.applyCtrl();for(let e=0;e<this.substeps;e++)this.mj.mj_step(this.model,this.data);this.tick++,this.poseSink&&this.poseSink(this.data.time,Na(this.model,this.data)),this.frameSink&&this.tick%this.frameEvery===0&&this.frameSink()}async stepAsync(){this.step(),this.pace&&await this.pace()}poseSnapshot(){return{t:this.data.time,poses:Na(this.model,this.data)}}id(e,t){return this.mj.mj_name2id(this.model,this.mj.mjtObj[e].value,t)}render(e="scene"){let t=this.cfg.sim.cameras[e],n=`${e}_cam`,s=this.id("mjOBJ_CAMERA",n);if(s<0)throw new Error(`no camera '${n}'`);let r=this.data.cam_xmat.subarray(s*9,s*9+9),o=this.data.cam_xpos.subarray(s*3,s*3+3),a=[r[0],r[1],r[2],o[0],r[3],r[4],r[5],o[1],r[6],r[7],r[8],o[2],0,0,0,1];return{camera:gx(e,t.width,t.height,this.model.cam_fovy[s],a),t:this.data.time,png:async()=>this.imageProvider?this.imageProvider(e):null}}heightMap(e,t,n,s,r){let o=Math.trunc(2*n/s),a=new Float64Array(o*o).fill(-1/0),c=new Float64Array(3),l=new Float64Array([0,0,-1]),h=new Uint8Array([1,0,0,0,0,0]),d=new Int32Array(1),u=new Float64Array(3),f=.5,g=0,b=[];for(let R=0;R<o;R++)for(let S=0;S<o;S++){c[0]=e-n+(S+.5)*s,c[1]=t-n+(R+.5)*s,c[2]=f;let M=this.mj.mj_ray(this.model,this.data,c,l,h,1,-1,d,u);if(M<0)continue;let w=Math.min(f-M,r);a[R*o+S]=w,b.push(w),g++}if(g<200)return null;let m=new Map;for(let R of b){if(R<=-.05||R>=r)continue;let S=Math.floor((R+.05)/.002);m.set(S,(m.get(S)??0)+1)}let p=0,x=-1;for(let[R,S]of m)(S>x||S===x&&R<p)&&([p,x]=[R,S]);return{hm:a,n:o,zTable:-.05+p*.002+.001}}rayPnt=new Float64Array(3);rayVec=new Float64Array(3);rayGeom=new Int32Array(1);rayNormal=new Float64Array(3);static VISIBLE_GROUPS=new Uint8Array([1,1,1,0,0,0]);castRay(e,t){for(let s=0;s<3;s++)this.rayPnt[s]=e[s],this.rayVec[s]=t[s];let n=this.mj.mj_ray(this.model,this.data,this.rayPnt,this.rayVec,i.VISIBLE_GROUPS,1,-1,this.rayGeom,this.rayNormal);return n<0?null:n}freeTableSpot(){let e=this.task.objects.map(l=>this.objectPos(l.name).slice(0,2)),t=this.dims.tray_half/.09,n=this.task.objects.map(l=>(l.type==="tray"?.14:.08)*t),s=[0,0,0],r=-1e9,[o,a,c]=this.profile.id==="franka"?[.34,.62,.34]:[.11,.26,.15];for(let l=0;l<15;l++){let h=o+(a-o)*l/14;for(let d=0;d<35;d++){let u=-c+2*c*d/34,f=Math.min(...e.map((g,b)=>Math.hypot(h-g[0],u-g[1])-n[b]));f-=.15*Math.abs(u),f>r&&(s=[h,u,0],r=f)}}return s}bottleFrame(e){for(let t of this.task.objects)if(t.type==="bottle"&&(e===`${t.name}_body_center`||e===`${t.name}_cap_end`)){let n=this.id("mjOBJ_BODY",t.name),s=this.data.xmat;return[Array.from(this.data.xpos.subarray(n*3,n*3+3)),[s[n*9+2],s[n*9+5],s[n*9+8]]]}return null}bottleLying(e="bottle"){let t=this.id("mjOBJ_BODY",e);return Math.abs(this.data.xmat[t*9+8])<.5}gtKeypoint(e){let t=this.pushHint[e];if(t)return[[...t],[0,0,1]];let n=this.bottleFrame(e);if(n){let[o,a]=n,c=this.dims,l=[0,0,1],h=Nn(l,a),d=[l[0]-h*a[0],l[1]-h*a[1],l[2]-h*a[2]],u=Mt(d)>.001,f=u?fn(d):l;if(e.endsWith("_body_center"))return u?[[o[0]+c.bottle_r*f[0],o[1]+c.bottle_r*f[1],o[2]+c.bottle_r*f[2]],l]:[[o[0]+a[0]*c.bottle_half_h,o[1]+a[1]*c.bottle_half_h,o[2]+a[2]*c.bottle_half_h],a];let g=c.bottle_half_h+c.cap_half_h,b=[o[0]+a[0]*g,o[1]+a[1]*g,o[2]+a[2]*g];return u?[[b[0]+c.cap_r*f[0],b[1]+c.cap_r*f[1],b[2]+c.cap_r*f[2]],l]:[[b[0]+a[0]*c.cap_half_h,b[1]+a[1]*c.cap_half_h,b[2]+a[2]*c.cap_half_h],a]}if(e==="table_free_spot")return[this.freeTableSpot(),[0,0,1]];let s=this.id("mjOBJ_SITE",e);if(s<0)throw new Error(`unknown keypoint '${e}'`);let r=this.data.site_xmat;return[Array.from(this.data.site_xpos.subarray(s*3,s*3+3)),[r[s*9+2],r[s*9+5],r[s*9+8]]]}visibleKeypoint(e){let[t,n]=this.gtKeypoint(e),s=t;if(e==="box_inside"){let r=this.objectPos("box"),o=this.dims.tray_half,a=this.task.objects.filter(c=>c.name!=="box").map(c=>this.objectPos(c.name)).filter(c=>Math.abs(c[0]-r[0])<o&&Math.abs(c[1]-r[1])<o&&c[2]<.1);if(a.length){let c=a.reduce((l,h)=>l+(h[1]-r[1]),0)/a.length;s=[s[0],s[1]+(c>0?-.55:.55)*o,s[2]]}}return[s,n]}gtAxis(e){if(!e.startsWith("cube"))return[null,180];let t=this.id("mjOBJ_SITE",e),n=this.data.site_xmat;return[[n[t*9],n[t*9+3],n[t*9+6]],90]}objectPos(e){let t=this.id("mjOBJ_BODY",e);return Array.from(this.data.xpos.subarray(t*3,t*3+3))}objectVel(e){let t=this.id("mjOBJ_BODY",e);return Array.from(this.data.cvel.subarray(t*6+3,t*6+6))}hasKeypoint(e){return e==="table_free_spot"||e in this.pushHint||this.bottleFrame(e)!==null||this.id("mjOBJ_SITE",e)>=0}bodyAxisZ(e){let t=this.id("mjOBJ_BODY",e),n=this.data.xmat;return[n[t*9+2],n[t*9+5],n[t*9+8]]}close(){this.jacP.delete(),this.jacR.delete(),this.data.delete(),this.model.delete()}};us();Un();var Kt=class extends Error{constructor(){super("aborted")}};function Wl(i){let e=[`# subtask ${i.subtaskId}: ${i.name}`];return i.stages.forEach((t,n)=>{e.push(`stage ${n}:`);for(let s of[...t].sort((r,o)=>r.priority-o.priority))e.push(`  [p${s.priority}] ${s.describe()}`)}),e.join(`
`)}function Wd(i,e,t){let n=i.controllers.filter(a=>a.param&&!(a.param in t)).map(a=>a.param);if(n.length)throw new Error(`subtask ${i.subtask_id}: no value for parameters ${JSON.stringify([...new Set(n)].sort())}`);let s=i.controllers.map(a=>xd(a,t)),r=1+s.reduce((a,c)=>Math.max(a,c.stage),0),o=[];for(let a=0;a<r;a++)o.push(s.filter(c=>c.stage===a));return{subtaskId:i.subtask_id,name:e,stages:o.filter(a=>a.length),values:{...t}}}var Hd=2,_x=.003,Fa=class{constructor(e,t,n){this.robot=e;this.cfg=t;this.qHome=n;this.dt=1/t.sim.control_hz}dt;qDes=null;async hold(e=.2){let t=Math.trunc(e/this.dt);for(let n=0;n<t;n++)this.servo([]),await this.robot.stepAsync()}holdTerms(e,t,n){let s=this.cfg.execution,[r,o]=this.robot.jacobian(e.tcp_pos),a=ud(hd(n,e.tcp_rot));return[{J:r,e:new Float64Array([t[0]-e.tcp_pos[0],t[1]-e.tcp_pos[1],t[2]-e.tcp_pos[2]]),gain:s.pos_gain,v_max:s.max_lin_speed},{J:o,e:new Float64Array(a),gain:s.ang_gain,v_max:s.max_ang_speed}]}async goHome(e=2.5){await this.liftClear(),this.robot.setGripper(this.robot.max_width);let t=this.robot.state().q.slice(),n=Math.trunc(e/this.dt);for(let s=1;s<=n;s++){let r=s/n,o=r*r*(3-2*r);this.robot.setJointTargets(t.map((a,c)=>a+(this.qHome[c]-a)*o)),await this.robot.stepAsync()}this.qDes=null,await this.hold(.3)}async liftClear(e=.06,t=.04,n=1.5){if(this.robot.state().tcp_pos[2]>=e)return;let r=new sr("eef_tcp","eef_tcp","z",t,1,0),o=this.cfg;this.cfg={...this.cfg,execution:{...this.cfg.execution,max_subtask_seconds:n}};try{await this.runSubtask({subtaskId:0,name:"lift clear",stages:[[r]],values:{}},{})}catch(a){if(a instanceof Kt)throw a}finally{this.cfg=o}}servo(e){let t=this.robot.state();this.qDes===null&&(this.qDes=t.q.slice());let n=this.cfg.execution,s=this.robot.n_joints,r=e.length?_d(e,s,n.damping,this.qHome.map((a,c)=>a-t.q[c])):new Float64Array(s),o=this.qDes;this.qDes=o.map((a,c)=>Math.min(Math.max(a+r[c]*this.dt,t.q[c]-.12),t.q[c]+.12)),this.robot.setJointTargets(this.qDes)}async runSubtask(e,t,n){this.qDes=null;let s=this.cfg.execution,r=this.robot.state().t,o=0,a=(d,u)=>({subtask_id:e.subtaskId,name:e.name,success:!1,reason:u,sim_seconds:d.t-r,stages_done:o,gripper_width:d.gripper_width}),c=(d,u,f)=>({robot:this.robot,state:d,keypoints:u,cfg:this.cfg,t_stage:f,dt:this.dt}),l=Math.trunc(Hd/this.dt);for(let d of e.stages){let u=typeof t=="function"?t():t,f=c(this.robot.state(),u,0);for(let M of d)M.onStageStart(f);let g=d.map(M=>M.gripperCommand()).filter(M=>M!==null);g.length&&this.robot.setGripper(g[g.length-1]);let b=0,m=0,p=[],x=this.robot.state(),R=[...x.tcp_pos],S=[...x.tcp_rot];for(;;){let M=this.robot.state();if(M.t-r>s.max_subtask_seconds){let I=c(M,u,m),k=d.filter(L=>!L.finished(I)).map(L=>L.describe());return a(M,"timeout"+(k.length?` (not converged: ${k.join("; ")})`:""))}if(p.push([...M.tcp_pos,...M.tcp_rot.map(I=>.1*I)]),p.length>l&&p.shift(),p.length===l&&m>Hd+.5){let I=c(M,u,m),k=d.filter(L=>!L.finished(I)).map(L=>L.describe());if(k.length){let L=0;for(let C=0;C<p[0].length;C++){let F=1/0,H=-1/0;for(let V of p)F=Math.min(F,V[C]),H=Math.max(H,V[C]);L=Math.max(L,H-F)}if(L<_x)return a(M,`stalled: no progress for 2 s, the target is probably out of reach or blocked (not converged: ${k.join("; ")})`)}}let w=c(M,u,m),E=d.map(I=>[I.priority,I.term(w)]),T=[...new Set(E.map(([I])=>I))].sort((I,k)=>I-k).map(I=>E.filter(([k,L])=>k===I&&L!==null).map(([,k])=>k)).filter(I=>I.length);if(T.length&&T.push(this.holdTerms(M,R,S)),this.servo(T),await this.robot.stepAsync(),m+=this.dt,b=d.every(I=>I.finished(c(this.robot.state(),u,m)))?b+1:0,b>=3)break}o++,n?.(d)}let h=this.robot.state();return{subtask_id:e.subtaskId,name:e.name,success:!0,reason:"converged",sim_seconds:h.t-r,stages_done:o,gripper_width:h.gripper_width}}};yr();dr();us();yr();Un();Un();us();var yx=.008,Ba=class{constructor(e=yx){this.minGraspWidth=e}holding=!1;expectGrasp=!0;reset(){this.holding=!1}check(e,t){let n=e.stages.flatMap(s=>s.filter(r=>r instanceof Ri).map(r=>r.action));if(!t.success)return{ok:!1,reason:`subtask '${t.name}' did not finish (${t.reason} after ${t.sim_seconds.toFixed(1)}s)`};if(n.includes("close")&&!this.expectGrasp)return{ok:!0,reason:""};if(n.includes("close")){if(t.gripper_width<this.minGraspWidth)return{ok:!1,reason:`grasp missed: gripper closed to ${(t.gripper_width*1e3).toFixed(1)} mm on nothing`};this.holding=!0}else if(n.includes("open"))this.holding=!1;else if(this.holding&&t.gripper_width<this.minGraspWidth)return{ok:!1,reason:"the held object was dropped during the motion"};return{ok:!0,reason:""}}},Xl=(i,e)=>Mt(i.objectVel(e))<.05;function xx(i,e,t){let n=i.objectPos(e),s=i.objectPos(t),r=i.dims,o=r.tray_half-r.tray_wall_t;return Math.abs(n[0]-s[0])<o&&Math.abs(n[1]-s[1])<o&&n[2]<.11*r.tray_half/.09&&Xl(i,e)}function bx(i,e,t,n){let s=i.objectPos(e),r=i.objectPos(t),o=n||i.dims.cube;return Math.hypot(s[0]-r[0],s[1]-r[1])<.6*o&&Math.abs(s[2]-r[2]-o)<.3*o&&Xl(i,e)}function vx(i,e,t,n){let s=i.objectPos(e),r=i.objectPos(t),o=n?.[e];if(o&&Math.hypot(s[0]-o[0],s[1]-o[1])<.06)return!1;let a=i.dims.tray_half+.015;return(Math.abs(s[0]-r[0])>a||Math.abs(s[1]-r[1])>a)&&s[2]<.1&&Xl(i,e)}function $d(i,e,t){let n={};for(let r of e.success)n[`${r.type}(${r.object},${r.target})`]=r.type==="outside"?vx(i,r.object,r.target,t):r.type==="inside"?xx(i,r.object,r.target):bx(i,r.object,r.target);let s=Object.values(n);return{success:s.length?s.every(Boolean):null,predicates:n}}Un();var za=class{kps={};held={};clear(){this.kps={},this.held={}}update(e){Object.assign(this.kps,e)}missing(e){return[...e].filter(t=>!(t in this.kps))}now(e,t){let n=this.held[e];if(n){let s=ls(t.tcp_rot,n.r);return{name:e,pos:[t.tcp_pos[0]+s[0],t.tcp_pos[1]+s[1],t.tcp_pos[2]+s[2]],normal:ls(t.tcp_rot,n.n),axis:null,axis_sym:180}}return this.kps[e]}snapshot(e,t){return Object.fromEntries(e.map(n=>[n,this.now(n,t)]))}onGrasp(e,t,n=.06){let s=[];for(let r of e){let o=this.now(r,t),a=Mt([o.pos[0]-t.tcp_pos[0],o.pos[1]-t.tcp_pos[1],o.pos[2]-t.tcp_pos[2]]);if(!(r in this.held)&&a<n){let c=o.normal??[0,0,1];this.held[r]={r:Ti(t.tcp_rot,[o.pos[0]-t.tcp_pos[0],o.pos[1]-t.tcp_pos[1],o.pos[2]-t.tcp_pos[2]]),n:Ti(t.tcp_rot,c)},s.push(r)}}return s}onRelease(e){for(let t of Object.keys(this.held))this.kps[t]=this.now(t,e),delete this.held[t]}},Sx=.008;function Mx(i,e){let t=new Int32Array(e*e),n=0,s=[];for(let r=0;r<e*e;r++)if(!(!i[r]||t[r]))for(n++,t[r]=n,s.push(r);s.length;){let o=s.pop(),a=Math.trunc(o/e),c=o%e;for(let l=-1;l<=1;l++)for(let h=-1;h<=1;h++){let d=a+l,u=c+h;if(d<0||u<0||d>=e||u>=e)continue;let f=d*e+u;i[f]&&!t[f]&&(t[f]=n,s.push(f))}}return t}function jd(i,e,t,n,s=.3,r=.005){let o=e[0],a=e[1],c=i.heightMap(o,a,s,r,n.max_z);if(!c)return{analyzable:!1};let{hm:l,n:h,zTable:d}=c,u=new Uint8Array(h*h);for(let y=0;y<u.length;y++)u[y]=Number.isFinite(l[y])&&l[y]>d+Sx?1:0;let f=Mx(u,h),g=(y,T)=>[Math.round((T-(a-s))/r),Math.round((y-(o-s))/r)],[b,m]=g(o,a),p=new Map;for(let y=Math.max(0,b-2);y<b+3;y++)for(let T=Math.max(0,m-2);T<m+3;T++){let P=y<h&&T<h?f[y*h+T]:0;P>0&&p.set(P,(p.get(P)??0)+1)}if(!p.size)return{analyzable:!1,reason:"the grasp point is not visible in the depth image"};let x=0,R=-1;for(let[y,T]of[...p].sort((P,I)=>P[0]-I[0]))T>R&&([x,R]=[y,T]);let S=Math.hypot(t[0],t[1]),M=[t[0]/S,t[1]/S],w=[-M[1],M[0]],E=[];for(let y of[1,-1]){let T=new Map;for(let P=0;P<8;P++){let I=-n.length/2+n.length*P/7;for(let k=0;k<9;k++){let L=-n.width/2+n.width*k/8,C=o+y*M[0]*(n.center+I)+w[0]*L,F=a+y*M[1]*(n.center+I)+w[1]*L,[H,V]=g(C,F);if(H>=0&&H<h&&V>=0&&V<h){let q=f[H*h+V];q>0&&q!==x&&T.set(q,(T.get(q)??0)+1)}}}if(T.size){let P=0,I=-1;for(let[Z,be]of T)be>I&&([P,I]=[Z,be]);let k=0,L=0,C=0,F=1/0,H=1/0,V=-1/0,q=1/0,X=-1/0,K=-1/0;for(let Z=0;Z<h*h;Z++){if(f[Z]!==P)continue;let be=o-s+Z%h*r,ve=a-s+Math.trunc(Z/h)*r;k+=be,L+=ve,C++,F=Math.min(F,Math.hypot(be-o,ve-a)),H=Math.min(H,be),V=Math.max(V,be),q=Math.min(q,ve),X=Math.max(X,ve),K=Math.max(K,l[Z])}E.push({side:y,distance:F,centroid:[k/C,L/C],size:[V-H,X-q],height:K-d})}}return{analyzable:!0,blocked:E.length>0,sides:E,finger_dir:M,target:[o,a]}}function qd(i,e,t){let[n,s]=i.finger_dir,[r,o]=i.target,a=l=>(l>=0?"+":"")+l.toFixed(2),c=[`Clearance check for grasping '${e}' at world (x=${r.toFixed(2)}, y=${o.toFixed(2)}): the gripper's fingers open along the direction (${a(n)}, ${a(s)}) and need about 6 cm of free table space on BOTH sides of the grasp point.`];for(let l of i.sides){let[h,d]=l.centroid,u=null;for(let b of Object.entries(t))(!u||Math.hypot(b[1][0]-h,b[1][1]-d)<Math.hypot(u[1][0]-h,u[1][1]-d))&&(u=b);let f=u&&Math.hypot(u[1][0]-h,u[1][1]-d)<.15?` (the object around keypoint '${u[0]}')`:"",g=[n*l.side,s*l.side];c.push(`BLOCKED on the side toward (${a(g[0])}, ${a(g[1])}): an object${f} centred at (x=${h.toFixed(2)}, y=${d.toFixed(2)}), about ${(l.size[0]*100).toFixed(0)} x ${(l.size[1]*100).toFixed(0)} cm and ${(l.height*100).toFixed(0)} cm tall, comes within ${(l.distance*100).toFixed(0)} cm of the grasp point, so a finger would hit it when the gripper descends.`)}return c.join(" ")}ur();var wx=240,Va=class extends Error{},Yd=(i,e)=>({task:i,seed:e,success:!1,error:"",subtasks_total:0,subtasks_ok:0,replans:0,retries:0,llm_calls:0,llm_calls_by_agent:{},input_tokens:0,output_tokens:0,cost_usd:0,llm_latency_s:0,wall_s:0,sim_s:0,grounding_err_mm:[],refined_err_mm:[],wrist_refinements:0,regrounds:0,infeasible:!1,obstacles:[],obstacles_cleared:0,skills_new:[],skills_reused:[],observations:"",normal_err_deg:[],predicates:{},verified:!0,subtask_log:[]}),xr=(i,e)=>Array.from(i,t=>Math.round(t*10**e)/10**e),Ga=class{constructor(e,t,n,s,r={}){this.env=e;this.llm=t;this.cfg=Od(n,e.profile),this.task=e.task.scene_context!==s.scene_context?{...s,scene_context:e.task.scene_context}:s,this.emit=r.emit??(()=>{}),this.library=r.library??null,this.hooks=r.hooks??{},this.decomposer=new Ea(t,e.profile),this.skillgen=new Ra(t,e.profile),this.paramset=new ui(t,e.profile),this.grounder=r.grounder??new ms(e),this.runtime=new Fa(e,this.cfg,e.q_home),this.monitor=new Ba(e.profile.grasp_min_width);for(let o of[this.decomposer,this.skillgen,this.paramset])o.emit=this.emit}decomposer;skillgen;paramset;grounder;runtime;monitor;store=new za;res=Yd("",0);tStart=0;startPos={};infos=[];planParams=null;finalOk={};cfg;task;emit;library;hooks;async plan(e){let t=this.env.render("scene"),n=this.task,s;if(this.cfg.pipeline.use_decomposer??!0?s=await this.decomposer.run(n.instruction,t,n.scene_context,e):s={observations:"",feasible:!0,reason:"",clears_obstacle:!1,subtasks:[{id:1,name:n.instruction,description:"Complete the whole task"}]},this.res.observations=s.observations,!s.feasible)throw new Va(s.reason);let{recipes:r,infos:o}=await this.skillgen.run(n.instruction,s,n.keypoints,this.library,e);this.infos=o,this.emit({type:"recipes",recipes:r.recipes,skills:o.map(l=>({subtask_id:l.subtask_id,skill:l.skill_name,reused:l.reused,description:l.description})),library_size:this.library?this.library.names().length:0});let a={};for(let l of o){let h=l.reused&&this.library?this.library.get(l.skill_name):void 0;h&&(a[l.subtask_id]={...h.defaults})}let c=await this.paramset.run(n.instruction,s,r,t,n.scene_context,e,a);return this.planParams=c,{dec:s,recipes:r,params:c}}async groundPlan(e){let t=new Map;for(let c of e.recipes)for(let l of c.keypoints)t.has(l.name)||t.set(l.name,l);let n=this.store.missing(t.keys()).map(c=>t.get(c));if(!n.length)return;let s=this.env.render("scene"),r=await this.grounder.ground(n,s);this.store.update(r);let o=this.grounder.lastPixels,a=Object.keys(o).length>0;this.emit({type:"grounding",image:(a?await this.hooks.overlayJpegBase64?.("scene",o):void 0)||(await this.hooks.sceneJpegBase64?.()??""),keypoints:Object.fromEntries(Object.entries(r).map(([c,l])=>[c,{pos:xr(l.pos,4),normal:l.normal?xr(l.normal,3):null,pixel:a?o[c]??null:null}]))});for(let[c,l]of Object.entries(r)){if(!this.env.hasKeypoint(c))continue;let[h,d]=this.env.gtKeypoint(c);if(this.res.grounding_err_mm.push(Mt([l.pos[0]-h[0],l.pos[1]-h[1],l.pos[2]-h[2]])*1e3),l.normal){let u=Math.min(1,Math.max(-1,l.normal[0]*d[0]+l.normal[1]*d[1]+l.normal[2]*d[2]));this.res.normal_err_deg.push(Math.acos(u)*180/Math.PI)}}}async wristRefine(e){if(!this.cfg.pipeline.wrist_refine||!("refineIters"in this.grounder))return;let t=this.env.state(),n=[];for(let s of e.controllers){let r=s.type==="PosAlign"&&s.source==="eef_tcp"?Ai(s.target):null;r&&r in this.store.kps&&!(r in this.store.held)&&!n.includes(r)&&n.push(r)}for(let s of n){let r=this.store.kps[s];if(Math.hypot(r.pos[0]-t.tcp_pos[0],r.pos[1]-t.tcp_pos[1])>.1)continue;let o=this.env.render("wrist"),a;try{let h=e.keypoints.find(d=>d.name===s)?.description??this.task.keypoints[s]??"";a=(await this.grounder.ground([{name:s,description:h}],o))[s]}catch(h){if(!(h instanceof On||h instanceof ps))throw h;this.emit({type:"status",text:`wrist re-grounding of ${s} failed, keeping the scene estimate (${h.message})`});continue}let c=Mt([a.pos[0]-r.pos[0],a.pos[1]-r.pos[1],a.pos[2]-r.pos[2]]);if(c>.06){this.emit({type:"status",text:`wrist re-grounding of ${s} moved it ${(c*100).toFixed(0)} cm - rejected`});continue}if(this.store.kps[s]=a,this.res.wrist_refinements++,this.env.hasKeypoint(s)){let h=this.env.gtKeypoint(s)[0];this.res.refined_err_mm.push(Mt([a.pos[0]-h[0],a.pos[1]-h[1],a.pos[2]-h[2]])*1e3)}let l=this.grounder.lastPixels;this.emit({type:"grounding",source:"wrist close-up",image:await this.hooks.overlayJpegBase64?.("wrist",l)??"",keypoints:Object.fromEntries(Object.entries(this.store.kps).filter(([h])=>!(h in this.store.held)).map(([h,d])=>[h,{pos:xr(d.pos,4),normal:d.normal?xr(d.normal,3):null,pixel:l[h]??null}]))})}}async commitSkills(e){if(!(!this.library||!this.infos.length||!this.planParams)){for(let t of this.infos){let n=t.subtask_id,s=t.skill_name,r=t.recipe,o=new Set(r.params.map(c=>c.name)),a=Object.fromEntries(Object.entries(ui.valuesFor(this.planParams,n)).filter(([c])=>o.has(c)));t.reused?n in this.finalOk&&(await this.library.record(s,this.finalOk[n],a),this.res.skills_reused.push(s)):e&&(this.finalOk[n]??!1)&&(await this.library.add(Cd({name:s,description:t.description.trim(),roles:Object.keys(t.role_bindings).sort(),controllers:Ld(r.controllers,t.role_bindings),params:r.params,defaults:a,uses:1,successes:1})),this.res.skills_new.push(s))}this.emit({type:"library",skills:this.library.api()})}}stageDone=e=>{let n=e.filter(s=>s instanceof Ri).map(s=>s.action);n.includes("close")&&this.env.state().gripper_width>=this.monitor.minGraspWidth?this.store.onGrasp(Object.keys(this.store.kps),this.env.state()):n.includes("open")&&this.store.onRelease(this.env.state())};fingerDir(e,t){let n=this.env.state(),s=e.controllers.find(a=>a.type==="YawAlign");if(s)try{let a=e.keypoints.map(h=>h.name),c={robot:this.env,state:n,keypoints:this.store.snapshot(a,n),cfg:this.cfg,t_stage:0,dt:.02},l=ci(c,s.target).slice(0,2);if(Math.hypot(l[0],l[1])>1e-6){let h=Math.hypot(l[0],l[1]),d=[l[0]/h,l[1]/h],u=t[s.param]??90;return Math.abs(u-90)<45?[-d[1],d[0]]:d}}catch{}let r=[n.tcp_rot[1],n.tcp_rot[4]],o=Math.hypot(r[0],r[1]);return[r[0]/o,r[1]/o]}checkGeometry(e,t){for(let n of e.recipes){let s=ui.valuesFor(t,n.subtask_id);for(let r of n.controllers){if(!(r.type==="AxisAlign"&&(r.source==="eef_z"||r.source==="eef_z_axis")&&/(_normal|_norm)$/.test(r.target??"")))continue;let o=Ai(r.target),a=this.store.kps[o];if(!a||!a.normal||o in this.store.held)continue;let c=s[r.param]??180;if(c>120&&Math.abs(a.normal[2])<.6){let l=a.normal,h=d=>(d>=0?"+":"")+d.toFixed(2);return`Surface check: keypoint '${o}' lies on a surface whose normal points SIDEWAYS (n = ${h(l[0])}, ${h(l[1])}, ${h(l[2])} in world x, y, z). Aligning the gripper with it (AxisAlign eef_z vs ${r.target}, ${c.toFixed(0)} deg) would make the gripper point horizontally, which this top-down gripper cannot do. Do NOT clear anything: re-plan the task and grasp/target a point on an UPWARD-facing surface instead (for an object lying on its side, define new keypoints such as \`<obj>_body_center\`: the top of its body, and \`<obj>_cap_end\`: its far end). To point the gripper straight down use AxisAlign(eef_z, world_z, 180) - never the measured normal of a curved surface.`}}}return null}checkObstacles(e,t){for(let n of e.recipes){if(!n.controllers.some(o=>o.type==="Gripper"&&o.action==="close"))continue;let s=[];for(let o of n.controllers){let a=o.type==="PosAlign"&&o.source==="eef_tcp"?Ai(o.target):null;a&&a in this.store.kps&&!(a in this.store.held)&&!s.includes(a)&&s.push(a)}let r=ui.valuesFor(t,n.subtask_id);for(let o of s){let a=jd(this.env,this.store.kps[o].pos,this.fingerDir(n,r),this.env.profile.finger);if(a.blocked){let c=Object.fromEntries(Object.entries(this.store.kps).filter(([l])=>l!==o).map(([l,h])=>[l,h.pos]));return qd(a,o,c)}}}return null}async executePlan(e,t,n,s,r=!1){let o=this.cfg.pipeline,a=Object.fromEntries(e.subtasks.map(c=>[c.id,c.name]));this.finalOk={},this.monitor.reset(),this.monitor.expectGrasp=!e.clears_obstacle,this.store.clear();try{await this.groundPlan(t)}catch(c){if(c instanceof On||c instanceof ps)return`grounding failed: ${c.message}`;throw c}if(r&&this.cfg.pipeline.obstacle_check){let c=this.checkGeometry(t,n)||this.checkObstacles(t,n);if(c)return"OBSTACLE: "+c}this.res.subtasks_total+=e.subtasks.length;for(let c of t.recipes){let l=c.subtask_id,h=a[l],d=ui.valuesFor(n,l),u=Wd(c,h,d),f=c.keypoints.map(g=>g.name);for(let g=0;g<1+o.max_subtask_retries;g++){if(this.env.state().t-this.tStart>wx)return"episode time budget exhausted";let b=()=>this.store.snapshot(f,this.env.state());await this.wristRefine(c);let m=b();this.emit({type:"subtask_start",id:l,name:h,attempt:g,script:Wl(u)});let p=await this.runtime.runSubtask(u,b,this.stageDone),x=this.monitor.check(u,p);if(this.res.subtask_log.push({plan:s,subtask:l,name:h,attempt:g,reason:p.reason,sim_s:Math.round(p.sim_seconds*100)/100,gripper_mm:Math.round(p.gripper_width*1e4)/10,ok:x.ok,verdict:x.reason,script:Wl(u),keypoints:Object.fromEntries(Object.entries(m).map(([R,S])=>[R,xr(S.pos,4)]))}),this.emit({type:"subtask_end",id:l,name:h,ok:x.ok,reason:p.reason,verdict:x.reason,sim_s:Math.round(p.sim_seconds*100)/100}),this.finalOk[l]=x.ok,x.ok){this.res.subtasks_ok++;break}if(g<o.max_subtask_retries&&p.reason==="timeout"){this.res.retries++;continue}return x.reason}}return null}async run(e,t=!0){let n=performance.now(),s=this.res=Yd(this.task.name,e);this.llm.usage=new di;for(let a of[this.decomposer,this.skillgen,this.paramset])a.trace=[];let r=this.cfg.pipeline;try{t?this.env.reset(e):(Mt(this.env.state().q.map((u,f)=>u-this.env.q_home[f]))>.05||this.env.state().gripper_width<.87*this.env.max_width)&&(this.emit({type:"status",text:"returning to the home pose"}),await this.runtime.goHome()),this.tStart=this.env.state().t,this.startPos=Object.fromEntries(this.task.objects.map(u=>[u.name,[...this.env.objectPos(u.name)]]));let a=null,c=0,l=0,h=0;for(;;){let{dec:u,recipes:f,params:g}=await this.plan(a),b=0;for(;a=await this.executePlan(u,f,g,`p${h}`+(b?`r${b}`:""),!u.clears_obstacle&&l<(r.max_obstacle_rounds??2)),!(a===null||a.startsWith("OBSTACLE:")||b>=(r.max_regrounds??0)||a.includes("time budget"));)b++,s.regrounds++,this.emit({type:"status",text:`${a} - returning home to look again (attempt ${b+1})`}),await this.runtime.goHome(),"tempBoost"in this.grounder&&(this.grounder.tempBoost=.4);if("tempBoost"in this.grounder&&(this.grounder.tempBoost=0),h++,a===null){if(u.clears_obstacle&&h<8){await this.commitSkills(!0),s.obstacles_cleared++,this.emit({type:"status",text:"obstacle cleared - looking at the scene again to plan the task"}),await this.runtime.goHome();continue}break}if(a.startsWith("OBSTACLE:")&&h<8){l++,s.obstacles.push(a.slice(9).trim()),this.emit({type:"obstacle",text:s.obstacles[s.obstacles.length-1]});continue}if(s.error=a,c<r.max_replans){c++,s.replans++,this.emit({type:"replan",reason:a}),await this.runtime.goHome();let m=this.env.state().gripper_width;a=`The previous plan failed: ${a}. The gripper is currently ${m>.06?"open":"closed"} (opening ${(m*1e3).toFixed(0)} mm). Plan a recovery from the current scene.`;continue}break}a===null&&(s.error=""),await this.runtime.hold(1);let d=$d(this.env,this.task,this.startPos);s.verified=d.success!==null,s.success=s.verified?d.success:s.error==="",s.predicates=d.predicates,await this.commitSkills(s.success)}catch(a){if(a instanceof Kt)throw a;a instanceof Va?(s.error=`cannot do this: ${a.message}`,s.infeasible=!0,s.verified=!1,s.success=!1):s.error=a instanceof Error&&a.name==="BedrockError"?a.message:`${a instanceof Error?a.constructor.name:"Error"}: ${a instanceof Error?a.message:String(a)}`}let o=this.llm.usage;return s.llm_calls=o.nCalls,s.llm_calls_by_agent=o.byAgent(),s.input_tokens=o.inputTokens,s.output_tokens=o.outputTokens,s.cost_usd=o.cost(this.llm.pricing),s.llm_latency_s=o.latencyS,s.wall_s=(performance.now()-n)/1e3,s.sim_s=this.env.state().t-this.tStart,s}};us();yr();cr();var $l={table_free_spot:"an empty spot of bare table, clear of all objects and the box",bottle_body_center:"the middle of the lying bottle's body, on its top surface",bottle_cap_end:"the top of the cap at the far end of the lying bottle"};function br(i,e){for(let t of Object.keys(i.keypoints))if(t.startsWith(e))return t;throw new Error(`no keypoint for ${e}`)}function Tx(i,e,t,n){let s=e.startsWith("cube");if(i.id==="franka")return{hover:.12,grasp:s?-.014:n?-.02:-.016,lift:s||n?.15:.2,hover_dest:n?.16:s?t==="box"?.2:.12:t!=="table"?.3:.26,place_force:2,place_z:null,retract:.15};let r=i.dims,o=s?r.cube:2*(r.bottle_half_h+r.cap_half_h),a=2*r.tray_wall_half_h,l=t==="box"?o+a+.005:t==="table"?o+.012:r.cube+.012;return{hover:.03,grasp:s?-.007:-.012,lift:.03,hover_dest:l,place_force:null,place_z:o+.004,retract:.04}}function Ax(i,e,t,n=Dl){let[s,r]=e??[i.success[0].object,i.success[0].target],o=Tx(n,s,r,t&&s==="bottle"),a=n.force_sensor,c=V=>n.id==="franka"?`${V}_normal`:"world_z",l=t&&s==="bottle",h=l?`${s}_body_center`:br(i,s),d=`${s}_cap_end`,u=r==="box"?"box_inside":r==="table"?"table_free_spot":br(i,r),f=s.replace(/_/g," ");if(l&&r==="box")return{dec:ds({observations:`The ${f} is lying on its side (about 0.17 m long).`,feasible:!1,reason:`The ${f} is lying down and is longer than the box's inner width (0.148 m); a top-down parallel gripper cannot stand it up or fit it inside. It can only be moved on the table.`,subtasks:[]}),rec:null,par:null};let b=[l?`Approach the lying ${f} from above`:`Approach ${f} for pre-grasp`,l?`Grasp the lying ${f} across its body`:`Grasp the ${f}`,`Lift the ${f} up`,`Move over the ${r.replace(/_/g," ")}`,`Place down the ${f}`,"Release and retract"].map((V,q)=>({id:q+1,name:V,description:V})),m=Cl,p=(V,q,X,K=0)=>["x","y","z"].filter(Z=>Z in X).map(Z=>m({type:"PosAlign",source:V,target:q,axis:Z,param:X[Z],priority:1,stage:K})),x=(V,q,X)=>({name:V,description:q,unit:X}),S=s.startsWith("cube")||l,M=l?`${h}__to__${d}`:`${h}_axis`,w=u.startsWith("cube"),E=w?[m({type:"YawAlign",source:"eef_y",target:`${u}_axis`,param:"o_yaw",priority:2})]:[],y=w?[x("o_yaw","finger direction vs destination edge","deg")]:[],T=m({type:"AxisAlign",source:"eef_z",target:c(u),param:"o_theta",priority:2}),P=S?[m({type:"YawAlign",source:"eef_y",target:M,param:"o_yaw",priority:2})]:[],I=S?[x("o_yaw","finger direction vs object edge / long axis","deg")]:[],k=()=>[x("o_x","x offset","m"),x("o_y","y offset","m")],L=[{subtask_id:1,keypoints:[],params:[...k(),x("o_z","hover height above the grasp point","m"),x("o_theta","angle between gripper axis and surface normal","deg"),...I],controllers:[...p("eef_tcp",h,{x:"o_x",y:"o_y",z:"o_z"}),m({type:"AxisAlign",source:"eef_z",target:c(h),param:"o_theta",priority:2}),...P]},{subtask_id:2,keypoints:[],params:[...k(),x("o_d","signed z offset of the fingertips from the keypoint (negative = below)","m"),x("o_theta","gripper vs normal angle","deg"),...I],controllers:[...p("eef_tcp",h,{x:"o_x",y:"o_y",z:"o_d"}),m({type:"AxisAlign",source:"eef_z",target:c(h),param:"o_theta",priority:2}),...P,m({type:"Gripper",action:"close",stage:1})]},{subtask_id:3,keypoints:[],params:[...k(),x("o_z","lift height","m"),x("o_theta","angle","deg")],controllers:[...p(h,h,{x:"o_x",y:"o_y",z:"o_z"}),m({type:"AxisAlign",source:"eef_z",target:c(h),param:"o_theta",priority:2})]},{subtask_id:4,keypoints:[],params:[...k(),x("o_z","hover height of the held keypoint over the destination","m"),x("o_theta","angle","deg"),...y],controllers:[...p(h,u,{x:"o_x",y:"o_y",z:"o_z"}),T,...E]},a?{subtask_id:5,keypoints:[],params:[...k(),x("f","contact force","N"),x("o_theta","angle","deg"),...y],controllers:[...p(h,u,{x:"o_x",y:"o_y"}),m({type:"Force",axis:"-z",param:"f"}),T,...E]}:{subtask_id:5,keypoints:[],params:[...k(),x("o_z","height of the held keypoint above the destination surface","m"),x("o_theta","angle","deg"),...y],controllers:[...p(h,u,{x:"o_x",y:"o_y",z:"o_z"}),T,...E]},{subtask_id:6,keypoints:[],params:[x("o_z","retract height","m")],controllers:[m({type:"Gripper",action:"open",stage:0}),m({type:"PosAlign",source:"eef_tcp",target:"eef_tcp",axis:"z",param:"o_z",stage:1})]}],C={1:{o_x:0,o_y:0,o_z:o.hover,o_theta:180,...S?{o_yaw:90}:{}},2:{o_x:0,o_y:0,o_d:o.grasp,o_theta:180,...S?{o_yaw:90}:{}},3:{o_x:0,o_y:0,o_z:o.lift,o_theta:180},4:{o_x:0,o_y:0,o_z:o.hover_dest,o_theta:180,...w?{o_yaw:90}:{}},5:{o_x:0,o_y:0,...a?{f:o.place_force}:{o_z:o.place_z},o_theta:180,...w?{o_yaw:90}:{}},6:{o_z:o.retract}},F={values:Object.entries(C).flatMap(([V,q])=>Object.entries(q).map(([X,K])=>({subtask_id:Number(V),name:X,value:Number(K),rationale:"reference"})))};for(let V of L)V.keypoints=li(V.controllers).filter(q=>q in $l).map(q=>({name:q,description:$l[q]}));let H=l?`The ${f} is lying on its side on the table.`:`The ${f} is standing / resting normally.`;return{dec:ds({observations:H,subtasks:b}),rec:{recipes:L},par:F}}function Ex(i,e,t){if(!i.feasible||!e||!t)return{dec:i,rec:e,par:t};let n=[],s=[],r=[],o=new Map,a=0;for(let l of e.recipes){let h=1+Math.max(...l.controllers.map(d=>d.stage));for(let d of l.controllers)n.push({...d,stage:d.stage+a,param:d.param?`${d.param}_${l.subtask_id}`:null});s.push(...l.params.map(d=>({...d,name:`${d.name}_${l.subtask_id}`}))),r.push(...t.values.filter(d=>d.subtask_id===l.subtask_id).map(d=>({...d,subtask_id:1,name:`${d.name}_${l.subtask_id}`})));for(let d of l.keypoints)o.set(d.name,d);a+=h}return{dec:ds({observations:i.observations,subtasks:[{...i.subtasks[0],name:"Complete the task"}]}),rec:{recipes:[{subtask_id:1,keypoints:[...o.values()],controllers:n,params:s}]},par:{values:r}}}function Rx(i,e,t){let n=[];for(let s of e.objects){if(t.has(s.name))continue;let r=i.objectPos(s.name);if(s.type==="tray")n.push([[r[0],r[1]],.13]);else if(s.type==="bottle")if(i.bottleLying(s.name)){let o=i.bodyAxisZ(s.name);for(let a=0;a<5;a++){let c=-.08+.16*a/4;n.push([[r[0]+o[0]*c,r[1]+o[1]*c],.035])}}else n.push([[r[0],r[1]],.035]);else n.push([[r[0],r[1]],.045])}return n}function Cx(i,e,t){let n=t?t[0]:i.success[0].object,s=e.gtKeypoint(n==="bottle"&&e.bottleLying()?`${n}_body_center`:br(i,n))[0],r=i.objects.filter(L=>L.name!==n),o=r[0],a=1/0;for(let L of r){let C=e.objectPos(L.name),F=Math.hypot(C[0]-s[0],C[1]-s[1]);F<a&&([o,a]=[L,F])}let c=e.objectPos(o.name),l=[c[0],c[1]],h=o.type==="tray"?.09:.02,d=Rx(e,i,new Set([o.name])),u=null;for(let L of[[1,0],[-1,0],[0,1],[0,-1]])for(let C of[.16,.22]){let F=[l[0]-L[0]*(h+.035),l[1]-L[1]*(h+.035)],H=Array.from({length:9},(X,K)=>[F[0]+L[0]*C*(K/8),F[1]+L[1]*C*(K/8)]);if(!H.every(X=>X[0]>=.3&&X[0]<=.64&&Math.abs(X[1])<=.34)||H.some(X=>d.some(([K,Z])=>Math.hypot(X[0]-K[0],X[1]-K[1])<Z+.03)))continue;let V=[l[0]+L[0]*C,l[1]+L[1]*C],q=Math.hypot(V[0]-s[0],V[1]-s[1])-.3*C;(u===null||q>u.score)&&(u={score:q,d:L,L:C,S:F})}if(u===null)return{dec:ds({observations:"Something blocks the grasp but there is no free side to push it from.",feasible:!1,reason:"An object blocks the gripper and it cannot be pushed away from any side.",subtasks:[]}),rec:null,par:null};let{d:f,L:g,S:b}=u,m=`${o.name}_push_start`;e.pushHint={[m]:[b[0],b[1],0]};let p=o.name.replace(/_/g," "),R=[`Move above the push start point beside the ${p}`,`Lower the closed gripper beside the ${p}`,`Push the ${p} away from the ${n}`,"Retract upward"].map((L,C)=>({id:C+1,name:L,description:L})),S=(L,C,F)=>({name:L,description:C,unit:F}),M=Cl,w=[{name:m,description:`a bare-table point just outside the ${p}'s wall, on the side opposite to the direction it should be pushed`}],E=(L,C)=>[M({type:"PosAlign",source:L,target:C,axis:"x",param:"o_x"}),M({type:"PosAlign",source:L,target:C,axis:"y",param:"o_y"})],y=[{subtask_id:1,keypoints:w,params:[S("o_x","x offset","m"),S("o_y","y offset","m"),S("o_z","hover height","m"),S("o_theta","angle","deg")],controllers:[...E("eef_tcp",m),M({type:"PosAlign",source:"eef_tcp",target:m,axis:"z",param:"o_z"}),M({type:"AxisAlign",source:"eef_z",target:`${m}_normal`,param:"o_theta",priority:2}),M({type:"Gripper",action:"close",stage:1})]},{subtask_id:2,keypoints:w,params:[S("o_x","x offset","m"),S("o_y","y offset","m"),S("o_z","tcp height above the table","m")],controllers:[...E("eef_tcp",m),M({type:"PosAlign",source:"eef_tcp",target:m,axis:"z",param:"o_z"})]},{subtask_id:3,keypoints:[],params:[S("o_x","x displacement","m"),S("o_y","y displacement","m"),S("o_z","z displacement","m")],controllers:[...E("eef_tcp","eef_tcp"),M({type:"PosAlign",source:"eef_tcp",target:"eef_tcp",axis:"z",param:"o_z"})]},{subtask_id:4,keypoints:[],params:[S("o_z","retract height","m")],controllers:[M({type:"PosAlign",source:"eef_tcp",target:"eef_tcp",axis:"z",param:"o_z"})]}],T={1:{o_x:0,o_y:0,o_z:.1,o_theta:180},2:{o_x:0,o_y:0,o_z:.03},3:{o_x:f[0]*g,o_y:f[1]*g,o_z:0},4:{o_z:.12}},P={values:Object.entries(T).flatMap(([L,C])=>Object.entries(C).map(([F,H])=>({subtask_id:Number(L),name:F,value:Number(H),rationale:"push plan"})))},I=L=>(L>=0?"+":"-")+Math.abs(L).toFixed(0);return{dec:ds({observations:`The ${p} is right beside the ${n}: the gripper's fingers would hit it. I will push the ${p} ${(g*100).toFixed(0)} cm along (${I(f[0])}, ${I(f[1])}) first.`,clears_obstacle:!0,subtasks:R}),rec:{recipes:y},par:P}}var Px={1:"move_above_push_start",2:"lower_closed_gripper",3:"push_along_table",4:"retract_up"},Ix={move_above_push_start:"Move the gripper above a start point on the table and close it into a pusher, pointing down.",lower_closed_gripper:"Lower the closed gripper to a low height (beside an object) without moving sideways.",push_along_table:"Slide the closed gripper horizontally by a set displacement to push whatever is in front of it.",retract_up:"Lift the gripper straight up."};function Lx(i,e){return{choices:i.recipes.map(n=>{let s=Px[n.subtask_id],r=li(n.controllers),o=r.length?{start:r[0]}:{};return e.has(s)?fs({subtask_id:n.subtask_id,skill_name:s,role_bindings:o,keypoints:n.keypoints}):fs({subtask_id:n.subtask_id,skill_name:s,role_bindings:o,keypoints:[],description:Ix[s],recipe:n})})}}var kx={1:"approach_above",2:"grasp_from_above",3:"lift_held",4:"move_over",5:"place_down_on_contact",6:"release_and_retract"},Dx={approach_above:"Move the gripper above a target point and point it straight down, aligned with the target's edges.",grasp_from_above:"Lower the open gripper onto a target point from above and close the fingers on it.",lift_held:"Lift the object held in the gripper straight up while keeping it level.",move_over:"Carry the held object over a destination point and hover above it, aligned with its edges.",place_down_on_contact:"Lower the held object onto the surface below until contact is felt.",release_and_retract:"Open the gripper to let go, then move straight up away from the object.",approach_above_aligned:"Move the gripper above a boxy target and point it down with the fingers aligned to the target's edges.",grasp_from_above_aligned:"Lower onto a boxy target from above with the fingers aligned to its faces and close the gripper.",move_over_aligned:"Carry the held object over a boxy destination and hover above it, edges aligned.",place_down_on_contact_aligned:"Lower the held object onto a boxy destination, edges aligned, until contact is felt.",place_down_to_height:"Lower the held object over the destination to a set height above its surface (no force sensing).",place_down_to_height_aligned:"Lower the held object onto a boxy destination, edges aligned, to a set height above its surface.",approach_above_long_axis:"Move the gripper above a lying elongated object with the fingers turned across its long axis.",grasp_from_above_long_axis:"Lower onto a lying elongated object from above across its width and close the fingers."};function Nx(i,e,t,n,s,r){let[o,a]=t??[e.success[0].object,e.success[0].target],c=n&&o==="bottle"?`${o}_body_center`:br(e,o),l=a==="box"?"box_inside":a==="table"?"table_free_spot":br(e,a),h={obj:c,dest:l,obj_end:`${o}_cap_end`};return{choices:i.recipes.map(u=>{let f=u.controllers.some(R=>R.type==="YawAlign"),b=(r||u.subtask_id!==5?kx[u.subtask_id]:"place_down_to_height")+(n&&(u.subtask_id===1||u.subtask_id===2)?"_long_axis":f?"_aligned":""),m=li(u.controllers),p=Object.fromEntries(Object.entries(h).filter(([,R])=>m.includes(R))),x=u.keypoints.filter(R=>R.name in $l);return s.has(b)?fs({subtask_id:u.subtask_id,skill_name:b,role_bindings:p,keypoints:x}):fs({subtask_id:u.subtask_id,skill_name:b,role_bindings:p,keypoints:[],description:Dx[b],recipe:u})})}}function Ux(i){let e=i.recipes[0],t=li(e.controllers),n=0;for(let s of t.join(","))n=n*31+s.charCodeAt(0)>>>0;return{choices:[fs({subtask_id:1,skill_name:`do_the_whole_task_${n%9999}`,role_bindings:Object.fromEntries(t.map(s=>[s,s])),description:"One-off plan for the whole task.",recipe:e})]}}var Ha=class{constructor(e,t,n=null){this.task=e;this.env=t;this.pair=n}usage=new di;defaultModel="scripted";pricing=Oa;plansCache=null;mode="task";clear=null;plans(){if(!this.plansCache){let e=this.task.objects.some(n=>n.type==="bottle"&&n.lying)&&this.env.bottleLying(),t=Ax(this.task,this.pair,e,this.env.profile);this.plansCache=[t,Ex(t.dec,t.rec,t.par),e]}return this.plansCache}single=e=>!e.includes(`
2. `)&&!e.includes("Subtask 2:");async structured(e){let t=performance.now(),n=e.messages[e.messages.length-1].content[0],s=typeof n=="string"?n:"",r;switch(e.agent){case"task_decomposer":s.includes("OBSTACLE")?(this.mode="clear",this.clear=Cx(this.task,this.env,this.pair),r=this.clear.dec):(this.mode="task",r=this.plans()[0].dec);break;case"skill_generator":{let a=new Set(Array.from(s.matchAll(/^- (\w+)\(roles:/gm),c=>c[1]));if(this.mode==="clear")r=Lx(this.clear.rec,a);else{let c=this.plans();r=this.single(s)?Ux(c[1].rec):Nx(c[0].rec,this.task,this.pair,c[2],a,this.env.profile.force_sensor)}break}case"parameter_setter":r=this.mode==="clear"?this.clear.par:this.single(s)?this.plans()[1].par:this.plans()[0].par;break;default:throw new Error("the Demo planner grounds with ground-truth keypoints; it has no vision pointing")}let o=e.schema.parse(JSON.parse(JSON.stringify(r)));return this.usage.add({agent:e.agent,model:"mock",input_tokens:0,output_tokens:0,latency_s:(performance.now()-t)/1e3,ok:!0}),o}};ur();async function tb(i){if(i.kind!=="bedrock")return null;let[{bedrockFromMessage:e},{registerPrompts:t}]=await Promise.all([Promise.resolve().then(()=>(ff(),df)),Promise.resolve().then(()=>(_f(),gf))]);return t(),e(i.msg)}var sh=i=>new Promise(e=>setTimeout(e,i));function nb(i,e,t=100){if(!i.remote)return i;let n=i.structured.bind(i);return i.structured=(async s=>{if(e())throw new Kt;let r=n(s).then(o=>({value:o}));for(r.catch(()=>{});;){let o;try{o=await Promise.race([r,sh(t).then(()=>null)])}catch(a){throw e()?new Kt:a}if(o)return o.value;if(e())throw i.abort?.(),new Kt}}),i}var ib=i=>`unknown planner '${i}'`,qa=class{constructor(e){this.deps=e}env=null;scene=null;robot=_s;seed=0;runs=0;cancelled=!1;chain=Promise.resolve();baseCfg=Fd;frameBusy=!1;lastFrameAt=0;renderMs=0;submit(e){return e.type==="stop"?(this.cancelled=!0,Promise.resolve()):this.enqueue(()=>this.handle(e))}enqueue(e){let t=this.chain.then(e);return this.chain=t.then(()=>{},()=>{}),t}stop(){this.cancelled=!0}put(e){this.deps.host.event(e)}async ensureEnv(e,t,n,s){let r=gr(s);if(!Nl(r,e))throw new Error(`the ${r.label} does not support the '${e}' scene`);let o=!this.env||this.scene!==e||this.robot!==s;return o&&(this.env?.close(),this.env=null,this.env=await Ua.create(this.deps.mj,this.deps.assets,Ul(e),this.baseCfg,r),this.scene=e,this.robot=s,this.deps.renderer?.setScene({...Gl(this.env.model,this.env.data),robot:s}),this.env.imageProvider=async a=>this.renderImage(a,"image/png")),(o||n)&&(this.env.reset(t),this.seed=t,this.runs=0),this.env}async renderImage(e,t,n=.75,s){let r=this.env,o=this.deps.renderer;if(!r||!o)return null;let a=r.render(e);return o.updatePoses(r.poseSnapshot().poses),o.render(a.camera,{width:s?.[0]??a.camera.width,height:s?.[1]??a.camera.height,mime:t,quality:n})}async pushState(e){let t=e.poseSnapshot();this.deps.host.pose(t.t,t.poses);let n=await this.renderImage("scene","image/jpeg",.75,[480,360]);n&&this.deps.host.frame(n)}sceneState(){this.put({type:"scene_state",scene:this.scene,robot:this.robot,seed:this.seed,runs:this.runs})}sceneData(e,t,n){return this.enqueue(async()=>{if(!_r[e])throw new Error("unknown scene");let s=await this.ensureEnv(e,t,!0,n);return{...Gl(s.model,s.data),view:gr(n).view,robot:n}})}async handle(e){let t=e.type;this.cancelled=!1;try{if(t==="load"||t==="reset"){let n=await this.ensureEnv(String(e.scene),Number(e.seed??0),t==="reset",String(e.robot||_s));await this.pushState(n),this.sceneState()}else t==="run"&&await this.run(e)}catch(n){if(n instanceof Kt)this.put({type:"stopped"}),this.sceneState();else{let s=n instanceof Error?n.constructor.name:"Error";this.put({type:"error",message:s==="BedrockError"?n.message:`${s}: ${n instanceof Error?n.message:String(n)}`,trace:n instanceof Error?(n.stack??"").slice(-1500):""})}}finally{t==="run"&&this.put({type:"ended"})}}async run(e){let t=String(e.robot||_s),n=String(e.scene),s=await this.ensureEnv(n,Number(e.seed??0),!1,t),r=e.grounding==="vlm"&&String(e.llm??"scripted")==="bedrock",o=Ia(this.baseCfg,{pipeline:{grounding:r?"vlm":"oracle",record_video:!1,skill_library_dir:e.skills===!1?null:`library-${t}`}}),a=String(e.instruction??"").trim(),c=Ul(n),{task:l,pair:h}=Dd(c,a||c.instruction),d=String(e.llm??"scripted");if(d==="scripted"&&h===null&&!c.success.length){this.put({type:"error",message:"The demo planner needs a command that names two objects, e.g. 'put the bottle into the box' or 'stack the red cube on the blue cube'. Free-form commands need the Claude (Bedrock) planner."});return}if(r&&!this.deps.renderer){this.put({type:"error",message:"Vision grounding needs the in-browser camera renderer (WebGL in a web worker), which this browser does not provide. Choose Oracle grounding."});return}let u={kind:d,task:l,env:s,pair:h,msg:e},f=await this.deps.llmFactory?.(u)??(d==="scripted"?new Ha(l,s,h):await tb(u));if(!f)throw new Error(ib(d));let g=nb(f,()=>this.cancelled),b=null;o.pipeline.skill_library_dir&&(b=new hr(this.deps.skillStorage(t)),await b.reload());let m=Number(e.speed??1),p=this.deps.realtime!==!1,x={t:s.data.time,wall:performance.now(),yielded:performance.now()};s.pace=async()=>{if(this.cancelled)throw new Kt;let w=s.data.time,E=performance.now();if(p&&m>0){let y=x.wall+(w-x.t)/m*1e3;if(y>E&&(await sh(y-E),E=performance.now(),x.yielded=E,this.cancelled))throw new Kt;x.wall=E}if(x.t=w,E-x.yielded>20&&(await sh(0),x.yielded=performance.now(),this.cancelled))throw new Kt},s.poseSink=(w,E)=>this.deps.host.pose(w,E),s.frameEvery=5,s.frameSink=()=>void this.streamFrame();let R=w=>{if(w.type==="agent"||w.type==="agent_start"||w.type==="agent_rejected"){let E=g.usage;w={...w,usage:{calls:E.nCalls,input_tokens:E.inputTokens,output_tokens:E.outputTokens,cost:E.cost(g.pricing??Oa)}}}this.put(w),x.wall=performance.now()};this.put({type:"started",instruction:l.instruction,planner:d,seed:this.seed,verified:l.success.length>0,model:g.defaultModel,continuing:this.runs>0});let S;try{let w=new ms(s);if(r){let[{VisionGrounder:y},{browserCodec:T}]=await Promise.all([Promise.resolve().then(()=>(Af(),Tf)),Promise.resolve().then(()=>($a(),eh))]);w=new y(g,s.profile,s,this.deps.codec??T,o.pipeline.refine_iters)}S=await new Ga(s,g,o,l,{emit:R,library:b,grounder:w,hooks:{sceneJpegBase64:async()=>Ef(await this.renderImage("scene","image/jpeg",.85,[640,480])??new Uint8Array),overlayJpegBase64:async(y,T)=>{try{let P=await this.renderImage(y,"image/png");if(!P)return"";let{browserCodec:I,drawPoints:k}=await Promise.resolve().then(()=>($a(),eh)),L=this.deps.codec??I;return Ef(await L.encode(k(await L.decode(P),T),"image/jpeg",.85))}catch{return""}}}}).run(this.seed,!1)}finally{s.poseSink=null,s.frameSink=null,s.pace=null}this.runs++;let M={...S,subtask_log:S.subtask_log.map(w=>Object.fromEntries(Object.entries(w).filter(([E])=>E!=="script")))};M.grounding_err_mm_mean=S.grounding_err_mm.length?S.grounding_err_mm.reduce((w,E)=>w+E,0)/S.grounding_err_mm.length:null,this.put({type:"done",result:M}),this.sceneState()}async streamFrame(){let e=performance.now();if(!(this.frameBusy||!this.deps.renderer||!this.env||e-this.lastFrameAt<Math.max(90,4*this.renderMs))){this.lastFrameAt=e,this.frameBusy=!0;try{let t=performance.now(),n=await this.renderImage("scene","image/jpeg",.75,[480,360]);this.renderMs=performance.now()-t,n&&this.deps.host.frame(n)}finally{this.frameBusy=!1}}}async listSkills(e){let t=new hr(this.deps.skillStorage(e));return await t.reload(),t.api()}dispose(){this.env?.close(),this.env=null}};function Ef(i){let e="";for(let t=0;t<i.length;t+=32768)e+=String.fromCharCode(...i.subarray(t,t+32768));return btoa(e)}var sb="motion-dooms",Pi="skills";function rh(){return new Promise((i,e)=>{let t=indexedDB.open(sb,1);t.onupgradeneeded=()=>t.result.createObjectStore(Pi,{keyPath:"key"}),t.onsuccess=()=>i(t.result),t.onerror=()=>e(t.error??new Error("IndexedDB unavailable"))})}var Ya=i=>new Promise((e,t)=>{i.onsuccess=()=>e(i.result),i.onerror=()=>t(i.error??new Error("IndexedDB request failed"))}),Ja=class{constructor(e){this.robot=e}async list(){let e=await rh();try{return(await Ya(e.transaction(Pi).objectStore(Pi).getAll())).filter(n=>n.robot===this.robot).map(n=>n.skill)}finally{e.close()}}async put(e){let t=await rh();try{let n={key:`${this.robot}/${e.name}`,robot:this.robot,skill:e};await Ya(t.transaction(Pi,"readwrite").objectStore(Pi).put(n))}finally{t.close()}}async clear(){let e=await rh();try{let t=e.transaction(Pi,"readwrite").objectStore(Pi),n=await Ya(t.getAll());await Promise.all(n.filter(s=>s.robot===this.robot).map(s=>Ya(t.delete(s.key))))}finally{e.close()}}};ur();var Rf=self,fi=(i,e=[])=>Rf.postMessage(i,e),Mr=null,rb=i=>{try{if(typeof indexedDB<"u")return new Ja(i)}catch{}return new lr},oh=new Map,ob=i=>{let e=rb(i);return e instanceof lr?(oh.has(i)||oh.set(i,e),oh.get(i)):e};async function ab(i,e){try{let t=await rd({url:i}),n=td();Mr=new qa({mj:t,assets:sd(e),renderer:n,skillStorage:ob,host:{event:s=>fi({kind:"event",ev:s}),pose:(s,r)=>fi({kind:"pose",t:s,poses:r},[r.buffer]),frame:s=>{let r=s.buffer.slice(s.byteOffset,s.byteOffset+s.byteLength);fi({kind:"frame",jpeg:r},[r])}}}),fi({kind:"ready",camera:n!==null})}catch(t){fi({kind:"fatal",message:t instanceof Error?t.message:String(t)})}}Rf.onmessage=i=>{let e=i.data;switch(e.op){case"init":ab(e.mujocoUrl,e.assetsBase);break;case"stop":Mr?.stop();break;case"cmd":Mr?.submit(e.msg);break;case"scene":if(!Mr){fi({kind:"reply",id:e.id,ok:!1,error:"The browser engine is not ready."});break}Mr.sceneData(e.name,e.seed,e.robot).then(t=>fi({kind:"reply",id:e.id,ok:!0,data:t}),t=>fi({kind:"reply",id:e.id,ok:!1,error:t instanceof Error?t.message:String(t)}));break}};
