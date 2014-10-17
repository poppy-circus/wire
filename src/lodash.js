/**
 * @license
 * Lo-Dash 2.4.1 (Custom Build) lodash.com/license | Underscore.js 1.5.2 underscorejs.org/LICENSE
 * Build: `lodash exports="amd" include="forEach,indexOf,merge,clone" --minify --output src/lodash.js`
 */
;(function(){function n(){return S.pop()||[]}function t(n){return typeof n.toString!="function"&&typeof(n+"")=="string"}function e(n){n.length=0,S.length<C&&S.push(n)}function r(n,t,e){t||(t=0),typeof e=="undefined"&&(e=n?n.length:0);var r=-1;e=e-t||0;for(var o=Array(0>e?0:e);++r<e;)o[r]=n[t+r];return o}function o(){}function u(n){function t(){if(o){var n=r(o);ot.apply(n,arguments)}if(this instanceof t){var i=a(e.prototype),n=e.apply(i,n||arguments);return d(n)?n:i}return e.apply(u,n||arguments)}var e=n[0],o=n[2],u=n[4];
return vt(t,n),t}function i(o,u,a,f,c){if(a){var l=a(o);if(typeof l!="undefined")return l}if(!d(o))return o;var s=Z.call(o);if(!T[s]||!yt.nodeClass&&t(o))return o;var p=pt[s];switch(s){case N:case R:return new p(+o);case z:case J:return new p(o);case G:return l=p(o.source,P.exec(o)),l.lastIndex=o.lastIndex,l}if(s=ht(o),u){var g=!f;f||(f=n()),c||(c=n());for(var y=f.length;y--;)if(f[y]==o)return c[y];l=s?p(o.length):{}}else l=s?r(o):wt({},o);return s&&(rt.call(o,"index")&&(l.index=o.index),rt.call(o,"input")&&(l.input=o.input)),u?(f.push(o),c.push(l),(s?jt:Ot)(o,function(n,t){l[t]=i(n,u,a,f,c)
}),g&&(e(f),e(c)),l):l}function a(n){return d(n)?ft(n):{}}function f(n,t,e){if(typeof n!="function")return O;if(typeof t=="undefined"||!("prototype"in n))return n;var r=n.__bindData__;if(typeof r=="undefined"&&(yt.funcNames&&(r=!n.name),r=r||!yt.funcDecomp,!r)){var o=tt.call(n);yt.funcNames||(r=!D.test(o)),r||(r=F.test(o),vt(n,r))}if(false===r||true!==r&&1&r[1])return n;switch(e){case 1:return function(e){return n.call(t,e)};case 2:return function(e,r){return n.call(t,e,r)};case 3:return function(e,r,o){return n.call(t,e,r,o)
};case 4:return function(e,r,o,u){return n.call(t,e,r,o,u)}}return E(n,t)}function c(n){function t(){var n=s?f:this;if(u){var h=r(u);ot.apply(h,arguments)}return(i||g)&&(h||(h=r(arguments)),i&&ot.apply(h,i),g&&h.length<l)?(o|=16,c([e,y?o:-4&o,h,null,f,l])):(h||(h=arguments),p&&(e=n[v]),this instanceof t?(n=a(e.prototype),h=e.apply(n,h),d(h)?h:n):e.apply(n,h))}var e=n[0],o=n[1],u=n[2],i=n[3],f=n[4],l=n[5],s=1&o,p=2&o,g=4&o,y=8&o,v=e;return vt(t,n),t}function l(r,o,u,i,a,f){if(u){var c=u(r,o);if(typeof c!="undefined")return!!c
}if(r===o)return 0!==r||1/r==1/o;if(r===r&&!(r&&M[typeof r]||o&&M[typeof o]))return false;if(null==r||null==o)return r===o;var s=Z.call(r),p=Z.call(o);if(s==B&&(s=K),p==B&&(p=K),s!=p)return false;switch(s){case N:case R:return+r==+o;case z:return r!=+r?o!=+o:0==r?1/r==1/o:r==+o;case G:case J:return r==o+""}if(p=s==L,!p){var g=rt.call(r,"__wrapped__"),y=rt.call(o,"__wrapped__");if(g||y)return l(g?r.__wrapped__:r,y?o.__wrapped__:o,u,i,a,f);if(s!=K||!yt.nodeClass&&(t(r)||t(o)))return false;if(s=!yt.argsObject&&h(r)?Object:r.constructor,g=!yt.argsObject&&h(o)?Object:o.constructor,s!=g&&!(b(s)&&s instanceof s&&b(g)&&g instanceof g)&&"constructor"in r&&"constructor"in o)return false
}for(s=!a,a||(a=n()),f||(f=n()),g=a.length;g--;)if(a[g]==r)return f[g]==o;var v=0,c=true;if(a.push(r),f.push(o),p){if(g=r.length,v=o.length,(c=v==g)||i)for(;v--;)if(p=g,y=o[v],i)for(;p--&&!(c=l(r[p],y,u,i,a,f)););else if(!(c=l(r[v],y,u,i,a,f)))break}else Et(o,function(n,t,e){return rt.call(e,t)?(v++,c=rt.call(r,t)&&l(r[t],n,u,i,a,f)):void 0}),c&&!i&&Et(r,function(n,t,e){return rt.call(e,t)?c=-1<--v:void 0});return a.pop(),f.pop(),s&&(e(a),e(f)),c}function s(n,t,e,r,o){(ht(t)?j:Ot)(t,function(t,u){var i,a,f=t,c=n[u];
if(t&&((a=ht(t))||_t(t))){for(f=r.length;f--;)if(i=r[f]==t){c=o[f];break}if(!i){var l;e&&(f=e(c,t),l=typeof f!="undefined")&&(c=f),l||(c=a?ht(c)?c:[]:_t(c)?c:{}),r.push(t),o.push(c),l||s(c,t,e,r,o)}}else e&&(f=e(c,t),typeof f=="undefined"&&(f=t)),typeof f!="undefined"&&(c=f);n[u]=c})}function p(n,t,e,o,i,a){var f=1&t,l=4&t,s=16&t,g=32&t;if(!(2&t||b(n)))throw new TypeError;s&&!e.length&&(t&=-17,s=e=false),g&&!o.length&&(t&=-33,g=o=false);var y=n&&n.__bindData__;return y&&true!==y?(y=r(y),y[2]&&(y[2]=r(y[2])),y[3]&&(y[3]=r(y[3])),!f||1&y[1]||(y[4]=i),!f&&1&y[1]&&(t|=8),!l||4&y[1]||(y[5]=a),s&&ot.apply(y[2]||(y[2]=[]),e),g&&it.apply(y[3]||(y[3]=[]),o),y[1]|=t,p.apply(null,y)):(1==t||17===t?u:c)([n,t,e,o,i,a])
}function g(){H.h=I,H.b=H.c=H.g=H.i="",H.e="t",H.j=true;for(var n,t=0;n=arguments[t];t++)for(var e in n)H[e]=n[e];t=H.a,H.d=/^[^,]+/.exec(t)[0],n=Function,t="return function("+t+"){",e=H;var r="var n,t="+e.d+",E="+e.e+";if(!t)return E;"+e.i+";";e.b?(r+="var u=t.length;n=-1;if("+e.b+"){",yt.unindexedChars&&(r+="if(s(t)){t=t.split('')}"),r+="while(++n<u){"+e.g+";}}else{"):yt.nonEnumArgs&&(r+="var u=t.length;n=-1;if(u&&p(t)){while(++n<u){n+='';"+e.g+";}}else{"),yt.enumPrototypes&&(r+="var G=typeof t=='function';"),yt.enumErrorProps&&(r+="var F=t===k||t instanceof Error;");
var o=[];if(yt.enumPrototypes&&o.push('!(G&&n=="prototype")'),yt.enumErrorProps&&o.push('!(F&&(n=="message"||n=="name"))'),e.j&&e.f)r+="var C=-1,D=B[typeof t]&&v(t),u=D?D.length:0;while(++C<u){n=D[C];",o.length&&(r+="if("+o.join("&&")+"){"),r+=e.g+";",o.length&&(r+="}"),r+="}";else if(r+="for(n in t){",e.j&&o.push("m.call(t, n)"),o.length&&(r+="if("+o.join("&&")+"){"),r+=e.g+";",o.length&&(r+="}"),r+="}",yt.nonEnumShadows){for(r+="if(t!==A){var i=t.constructor,r=t===(i&&i.prototype),f=t===J?I:t===k?j:L.call(t),x=y[f];",k=0;7>k;k++)r+="n='"+e.h[k]+"';if((!(r&&x[n])&&m.call(t,n))",e.j||(r+="||(!x[n]&&t[n]!==A[n])"),r+="){"+e.g+"}";
r+="}"}return(e.b||yt.nonEnumArgs)&&(r+="}"),r+=e.c+";return E",n("d,j,k,m,o,p,q,s,v,A,B,y,I,J,L",t+r+"}")(f,$,U,rt,A,h,ht,m,H.f,X,M,gt,J,Y,Z)}function y(n){return typeof n=="function"&&nt.test(n)}function v(n){var e,r;return!n||Z.call(n)!=K||(e=n.constructor,b(e)&&!(e instanceof e))||!yt.argsClass&&h(n)||!yt.nodeClass&&t(n)?false:yt.ownLast?(Et(n,function(n,t,e){return r=rt.call(e,t),false}),false!==r):(Et(n,function(n,t){r=t}),typeof r=="undefined"||rt.call(n,r))}function h(n){return n&&typeof n=="object"&&typeof n.length=="number"&&Z.call(n)==B||false
}function b(n){return typeof n=="function"}function d(n){return!(!n||!M[typeof n])}function m(n){return typeof n=="string"||n&&typeof n=="object"&&Z.call(n)==J||false}function j(n,t,e){if(t&&typeof e=="undefined"&&ht(n)){e=-1;for(var r=n.length;++e<r&&false!==t(n[e],e,n););}else jt(n,t,e);return n}function w(n,t,e,r){var u=0,i=n?n.length:u;for(e=e?o.createCallback(e,r,1):O,t=e(t);u<i;)r=u+i>>>1,e(n[r])<t?u=r+1:i=r;return u}function E(n,t){return 2<arguments.length?p(n,17,r(arguments,2),null,t):p(n,1,null,null,t)
}function O(n){return n}function _(){}function x(n){return function(t){return t[n]}}var S=[],A={},C=40,P=/\w*$/,D=/^\s*function[ \n\r\t]+\w/,F=/\bthis\b/,I="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" "),B="[object Arguments]",L="[object Array]",N="[object Boolean]",R="[object Date]",$="[object Error]",z="[object Number]",K="[object Object]",G="[object RegExp]",J="[object String]",T={"[object Function]":false};T[B]=T[L]=T[N]=T[R]=T[z]=T[K]=T[G]=T[J]=true;
var q={configurable:false,enumerable:false,value:null,writable:false},H={a:"",b:null,c:"",d:"",e:"",v:null,g:"",h:null,support:null,i:"",j:false},M={"boolean":false,"function":true,object:true,number:false,string:false,undefined:false},V=M[typeof window]&&window||this,W=M[typeof global]&&global;!W||W.global!==W&&W.window!==W||(V=W);var Q=[],U=Error.prototype,X=Object.prototype,Y=String.prototype,Z=X.toString,nt=RegExp("^"+(Z+"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/toString| for [^\]]+/g,".*?")+"$"),tt=Function.prototype.toString,et=y(et=Object.getPrototypeOf)&&et,rt=X.hasOwnProperty,ot=Q.push,ut=X.propertyIsEnumerable,it=Q.unshift,at=function(){try{var n={},t=y(t=Object.defineProperty)&&t,e=t(n,n,n)&&t
}catch(r){}return e}(),ft=y(ft=Object.create)&&ft,ct=y(ct=Array.isArray)&&ct,lt=y(lt=Object.keys)&&lt,st=Math.max,pt={};pt[L]=Array,pt[N]=Boolean,pt[R]=Date,pt["[object Function]"]=Function,pt[K]=Object,pt[z]=Number,pt[G]=RegExp,pt[J]=String;var gt={};gt[L]=gt[R]=gt[z]={constructor:true,toLocaleString:true,toString:true,valueOf:true},gt[N]=gt[J]={constructor:true,toString:true,valueOf:true},gt[$]=gt["[object Function]"]=gt[G]={constructor:true,toString:true},gt[K]={constructor:true},function(){for(var n=I.length;n--;){var t,e=I[n];
for(t in gt)rt.call(gt,t)&&!rt.call(gt[t],e)&&(gt[t][e]=false)}}();var yt=o.support={};!function(){function n(){this.x=1}var t={0:1,length:1},e=[];n.prototype={valueOf:1,y:1};for(var r in new n)e.push(r);for(r in arguments);yt.argsClass=Z.call(arguments)==B,yt.argsObject=arguments.constructor==Object&&!(arguments instanceof Array),yt.enumErrorProps=ut.call(U,"message")||ut.call(U,"name"),yt.enumPrototypes=ut.call(n,"prototype"),yt.funcDecomp=!y(V.k)&&F.test(function(){return this}),yt.funcNames=typeof Function.name=="string",yt.nonEnumArgs=0!=r,yt.nonEnumShadows=!/valueOf/.test(e),yt.ownLast="x"!=e[0],yt.spliceObjects=(Q.splice.call(t,0,1),!t[0]),yt.unindexedChars="xx"!="x"[0]+Object("x")[0];
try{yt.nodeClass=!(Z.call(document)==K&&!({toString:0}+""))}catch(o){yt.nodeClass=true}}(1),ft||(a=function(){function n(){}return function(t){if(d(t)){n.prototype=t;var e=new n;n.prototype=null}return e||V.Object()}}());var vt=at?function(n,t){q.value=t,at(n,"__bindData__",q)}:_;yt.argsClass||(h=function(n){return n&&typeof n=="object"&&typeof n.length=="number"&&rt.call(n,"callee")&&!ut.call(n,"callee")||false});var ht=ct||function(n){return n&&typeof n=="object"&&typeof n.length=="number"&&Z.call(n)==L||false
},bt=g({a:"z",e:"[]",i:"if(!(B[typeof z]))return E",g:"E.push(n)"}),dt=lt?function(n){return d(n)?yt.enumPrototypes&&typeof n=="function"||yt.nonEnumArgs&&n.length&&h(n)?bt(n):lt(n):[]}:bt,W={a:"g,e,K",i:"e=e&&typeof K=='undefined'?e:d(e,K,3)",b:"typeof u=='number'",v:dt,g:"if(e(t[n],n,g)===false)return E"},ct={a:"z,H,l",i:"var a=arguments,b=0,c=typeof l=='number'?2:a.length;while(++b<c){t=a[b];if(t&&B[typeof t]){",v:dt,g:"if(typeof E[n]=='undefined')E[n]=t[n]",c:"}}"},mt={i:"if(!B[typeof t])return E;"+W.i,b:false},jt=g(W),wt=g(ct,{i:ct.i.replace(";",";if(c>3&&typeof a[c-2]=='function'){var e=d(a[--c-1],a[c--],2)}else if(c>2&&typeof a[c-1]=='function'){e=a[--c]}"),g:"E[n]=e?e(E[n],t[n]):t[n]"}),Et=g(W,mt,{j:false}),Ot=g(W,mt);
b(/x/)&&(b=function(n){return typeof n=="function"&&"[object Function]"==Z.call(n)});var _t=et?function(n){if(!n||Z.call(n)!=K||!yt.argsClass&&h(n))return false;var t=n.valueOf,e=y(t)&&(e=et(t))&&et(e);return e?n==e||et(n)==e:v(n)}:v;o.assign=wt,o.bind=E,o.createCallback=function(n,t,e){var r=typeof n;if(null==n||"function"==r)return f(n,t,e);if("object"!=r)return x(n);var o=dt(n),u=o[0],i=n[u];return 1!=o.length||i!==i||d(i)?function(t){for(var e=o.length,r=false;e--&&(r=l(t[o[e]],n[o[e]],null,true)););return r
}:function(n){return n=n[u],i===n&&(0!==i||1/i==1/n)}},o.forEach=j,o.forIn=Et,o.forOwn=Ot,o.keys=dt,o.merge=function(t){var o=arguments,u=2;if(!d(t))return t;if("number"!=typeof o[2]&&(u=o.length),3<u&&"function"==typeof o[u-2])var i=f(o[--u-1],o[u--],2);else 2<u&&"function"==typeof o[u-1]&&(i=o[--u]);for(var o=r(arguments,1,u),a=-1,c=n(),l=n();++a<u;)s(t,o[a],i,c,l);return e(c),e(l),t},o.property=x,o.each=j,o.extend=wt,o.clone=function(n,t,e,r){return typeof t!="boolean"&&null!=t&&(r=e,e=t,t=false),i(n,t,typeof e=="function"&&f(e,r,1))
},o.identity=O,o.indexOf=function(n,t,e){if(typeof e=="number"){var r=n?n.length:0;e=0>e?st(0,r+e):e||0}else if(e)return e=w(n,t),n[e]===t?e:-1;n:{for(e=(e||0)-1,r=n?n.length:0;++e<r;)if(n[e]===t){n=e;break n}n=-1}return n},o.isArguments=h,o.isArray=ht,o.isFunction=b,o.isObject=d,o.isPlainObject=_t,o.isString=m,o.noop=_,o.sortedIndex=w,o.VERSION="2.4.1",typeof define=="function"&&typeof define.amd=="object"&&define.amd&& define(function(){return o})}).call(this);