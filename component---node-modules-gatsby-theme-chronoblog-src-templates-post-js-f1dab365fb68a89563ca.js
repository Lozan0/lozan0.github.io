(window.webpackJsonp=window.webpackJsonp||[]).push([[10],{"4M6O":function(t,e,n){"use strict";var o=n("TqRt");e.__esModule=!0,e.insertScript=function(t,e,n){var o=window.document.createElement("script");return o.async=!0,o.src=t,o.id=e,n.appendChild(o),o},e.removeScript=function(t,e){var n=window.document.getElementById(t);n&&e.removeChild(n)},e.debounce=function(t,e,n){var o;return function(){for(var r=arguments.length,a=new Array(r),i=0;i<r;i++)a[i]=arguments[i];var d=this,s=function(){o=null,n||t.apply(d,a)},u=n&&!o;window.clearTimeout(o),o=setTimeout(s,e),u&&t.apply(d,a)}},e.isReactElement=i,e.shallowComparison=function t(e,n){var o,a=new Set(Object.keys(e).concat(Object.keys(n)));return 0!==(o=[]).concat.apply(o,(0,r.default)(a)).filter((function(o){if("object"==typeof e[o]){if(t(e[o],n[o]))return!0}else if(e[o]!==n[o]&&!i(e[o]))return!0;return!1})).length};var r=o(n("RIqP")),a=o(n("q1tI"));function i(t){return!!a.default.isValidElement(t)||!!Array.isArray(t)&&t.some((function(t){return a.default.isValidElement(t)}))}},ORnI:function(t,e,n){"use strict";var o=n("TqRt");e.__esModule=!0,e.default=void 0;var r=o(n("VUT9"));e.Disqus=r.default;var a=o(n("qASQ"));e.CommentCount=a.default;var i=o(n("vAJ3"));e.CommentEmbed=i.default;var d=r.default;e.default=d},VUT9:function(t,e,n){"use strict";var o=n("TqRt");e.__esModule=!0,e.default=void 0;var r=o(n("pVnL")),a=o(n("8OQS")),i=o(n("VbXa")),d=o(n("q1tI")),s=o(n("17x9")),u=n("4M6O"),c=function(t){function e(e){var n;return(n=t.call(this,e)||this).shortname="chronoblog-hacker",n.embedUrl="https://"+n.shortname+".disqus.com/embed.js",n}(0,i.default)(e,t);var n=e.prototype;return n.componentDidMount=function(){this.loadInstance()},n.shouldComponentUpdate=function(t){return this.props!==t&&(0,u.shallowComparison)(this.props,t)},n.componentDidUpdate=function(){this.loadInstance()},n.componentWillUnmount=function(){this.cleanInstance()},n.getDisqusConfig=function(t){return function(){this.page.identifier=t.identifier,this.page.url=t.url,this.page.title=t.title,this.page.remote_auth_s3=t.remoteAuthS3,this.page.api_key=t.apiKey,this.language=t.language}},n.loadInstance=function(){"undefined"!=typeof window&&window.document&&(window.disqus_config=this.getDisqusConfig(this.props.config),window.document.getElementById("dsq-embed-scr")?this.reloadInstance():(0,u.insertScript)(this.embedUrl,"dsq-embed-scr",window.document.body))},n.reloadInstance=function(){window&&window.DISQUS&&window.DISQUS.reset({reload:!0})},n.cleanInstance=function(){(0,u.removeScript)("dsq-embed-scr",window.document.body);try{delete window.DISQUS}catch(o){window.DISQUS=void 0}var t=window.document.getElementById("disqus_thread");if(t)for(;t.hasChildNodes();)t.removeChild(t.firstChild);var e=window.document.querySelector('[id^="dsq-app"]');if(e){var n=window.document.getElementById(e.id);n.parentNode.removeChild(n)}},n.render=function(){var t=this.props,e=(t.config,(0,a.default)(t,["config"]));return d.default.createElement("div",(0,r.default)({id:"disqus_thread"},e))},e}(d.default.Component);e.default=c,c.propTypes={config:s.default.shape({identifier:s.default.string,title:s.default.string,url:s.default.string,language:s.default.string,remoteAuthS3:s.default.string,apiKey:s.default.string})}},fR2r:function(t,e,n){"use strict";n.d(e,"a",(function(){return m}));var o=n("wx14"),r=n("zLVn"),a=(n("q1tI"),n("7ljp")),i=(n("qKvR"),["components"]),d=function(t){return function(e){return console.warn("Component "+t+" was not imported, exported, or provided by MDXProvider as global scope"),Object(a.mdx)("div",e)}},s=d("FeedSearch"),u=d("Tags"),c=d("FeedItems"),l={_frontmatter:{}};function m(t){var e=t.components,n=Object(r.a)(t,i);return Object(a.mdx)("wrapper",Object(o.a)({},l,n,{components:e,mdxType:"MDXLayout"}),Object(a.mdx)("hr",null),Object(a.mdx)(s,{mdxType:"FeedSearch"}),Object(a.mdx)(u,{mdxType:"Tags"}),Object(a.mdx)(c,{mdxType:"FeedItems"}))}m.isMDXComponent=!0},qASQ:function(t,e,n){"use strict";var o=n("TqRt");e.__esModule=!0,e.default=void 0;var r=o(n("pVnL")),a=o(n("8OQS")),i=o(n("VbXa")),d=o(n("q1tI")),s=o(n("17x9")),u=n("4M6O"),c=(0,u.debounce)((function(){window.DISQUSWIDGETS&&window.DISQUSWIDGETS.getCount({reset:!0})}),300,!1),l=function(t){function e(e){var n;return(n=t.call(this,e)||this).shortname="chronoblog-hacker",n}(0,i.default)(e,t);var n=e.prototype;return n.componentDidMount=function(){this.loadInstance()},n.shouldComponentUpdate=function(t){return this.props!==t&&(0,u.shallowComparison)(this.props,t)},n.componentDidUpdate=function(){this.loadInstance()},n.componentWillUnmount=function(){this.cleanInstance()},n.loadInstance=function(){window.document.getElementById("dsq-count-scr")?c():(0,u.insertScript)("https://"+this.shortname+".disqus.com/count.js","dsq-count-scr",window.document.body)},n.cleanInstance=function(){(0,u.removeScript)("dsq-count-scr",window.document.body),window.DISQUSWIDGETS=void 0},n.render=function(){var t=this.props,e=t.config,n=t.className,o=t.placeholder,i=(0,a.default)(t,["config","className","placeholder"]),s="disqus-comment-count"+(n?" "+n:"");return d.default.createElement("span",(0,r.default)({className:s,"data-disqus-identifier":e.identifier,"data-disqus-url":e.url},i),o)},e}(d.default.Component);e.default=l,l.defaultProps={placeholder:"..."},l.propTypes={config:s.default.shape({identifier:s.default.string,title:s.default.string,url:s.default.string}),placeholder:s.default.string,className:s.default.string}},rR8Y:function(t,e,n){"use strict";n.r(e);var o,r=n("A2+M"),a=n("mwIZ"),i=n.n(a),d=n("txSG"),s=n("fR2r"),u=n("G4S6"),c=n("wx14"),l=n("zLVn"),m=(n("q1tI"),n("7ljp")),p=n("ORnI"),f=(n("qKvR"),["components"]),h=(o="AuthorBanner",function(t){return console.warn("Component "+o+" was not imported, exported, or provided by MDXProvider as global scope"),Object(m.mdx)("div",t)}),w={_frontmatter:{}};function b(t){var e=t.components,n=Object(l.a)(t,f);return Object(m.mdx)("wrapper",Object(c.a)({},w,n,{components:e,mdxType:"MDXLayout"}),Object(m.mdx)(h,{mdxType:"AuthorBanner"}),Object(m.mdx)("p",null," "),Object(m.mdx)(p.Disqus,{config:{url:n.siteMetadata.siteUrl+n.postData.fields.slug,title:n.postData.frontmatter.title,id:n.postData.id},mdxType:"Disqus"}))}b.isMDXComponent=!0;var g=n("b5zR"),v=n("+/9e"),y=n("zzhW"),O=n("/tuq"),x=n("MWwL"),j=function(t){var e=t.data.mdx.frontmatter;return Object(d.k)("div",null,e.title?Object(d.k)(d.h.h1,null,e.title):"")},I=function(t){var e=t.data.mdx.body;return Object(d.k)(r.MDXRenderer,null,e)},q=function(t){var e=t.postData,n=Object(u.a)();return Object(d.k)("div",{sx:{mt:"30px",mb:"30px"}},b&&""!==b?Object(d.k)(b,{siteMetadata:n,postData:e}):"")},S=function(t){var e,n,o=t.data,r=(e=o.mdx.frontmatter.description,n=o.mdx.excerpt,e&&""!==e?e:n&&""!==n?n:""),a=i()(o,"mdx.frontmatter.cover.childImageSharp.fluid.src","");return Object(d.k)(y.a,null,Object(d.k)(O.a,{title:o.mdx.frontmatter.title,slug:o.mdx.fields.slug,description:r,image:a}),Object(d.k)("main",null,Object(d.k)("article",null,Object(d.k)("header",null,Object(d.k)(g.a,{data:o.mdx,type:"post"}),Object(d.k)(j,{data:o}),Object(d.k)(v.a,{date:o.mdx.frontmatter.date}),Object(d.k)("div",{sx:{mt:20,mb:3}},Object(d.k)(x.a,{type:"item",tags:o.mdx.frontmatter.tags}))),Object(d.k)(I,{data:o}),Object(d.k)("footer",{sx:{marginTop:"20px"}},Object(d.k)(x.a,{type:"item",tags:o.mdx.frontmatter.tags}),Object(d.k)(q,{postData:o.mdx})))),Object(d.k)("aside",null,Object(d.k)(s.a,null)))};e.default=S},vAJ3:function(t,e,n){"use strict";var o=n("TqRt");e.__esModule=!0,e.default=void 0;var r=o(n("pVnL")),a=o(n("8OQS")),i=o(n("VbXa")),d=o(n("q1tI")),s=o(n("17x9")),u=function(t){function e(){return t.apply(this,arguments)||this}(0,i.default)(e,t);var n=e.prototype;return n.getSrc=function(){return"https://embed.disqus.com/p/"+Number(this.props.commentId).toString(36)+"?p="+(this.props.showParentComment?"1":"0")+"&m="+(this.props.showMedia?"1":"0")},n.render=function(){var t=this.props,e=(t.commentId,t.showMedia,t.showParentComment,(0,a.default)(t,["commentId","showMedia","showParentComment"]));return d.default.createElement("iframe",(0,r.default)({src:this.getSrc(),width:this.props.width,height:this.props.height,seamless:"seamless",scrolling:"no",frameBorder:"0",title:"embedded-comment"},e))},e}(d.default.Component);e.default=u,u.defaultProps={width:420,height:320,showMedia:!0,showParentComment:!0},u.propTypes={commentId:s.default.oneOfType([s.default.number,s.default.string]).isRequired,width:s.default.number,height:s.default.number,showMedia:s.default.bool,showParentComment:s.default.bool}}}]);
//# sourceMappingURL=component---node-modules-gatsby-theme-chronoblog-src-templates-post-js-f1dab365fb68a89563ca.js.map