var $ = {
			data:"",
			tmpl: function (template,respdata,bindTo,ignoreNode) {
				return new Promise(function(resolve,reject){
					$.fetchAndAppendTemplate(template).then(function() {
						let templateNodes = $.processTemplate(template,respdata,bindTo,ignoreNode);
						resolve(templateNodes);
					});
				});
			},
			processTemplate:function(template,respdata,bindTo,ignoreNode){
				$.currentContext = [] ;
				if(respdata!=null){
					$.data = respdata;
				}
				let templateNodes = document.getElementById(template).content.cloneNode(true);
				$.processElements(templateNodes.children);
				if(ignoreNode){
					while (templateNodes.children.length > 0)
					{
						bindTo.insertAdjacentElement('beforeBegin', templateNodes.children[0]);
					}
				}
				return templateNodes;
			},
			fetchAndAppendTemplate:function(template_name){
				return new Promise(function(resolve,reject){
					if(document.querySelectorAll('template[id='+template_name+']').length>0){
						resolve();
					}else{
						fetch('/saascrafts/templates/'+template_name+'.html').then(function (response) {
							return response.text();
						}).then(function(template_content) {
							document.body.insertAdjacentHTML('beforeend',template_content);
							let subtemplate_promises = [] ;
							document.getElementById(template_name).content.querySelectorAll("[template-source]").forEach(function(el) {
								 let subtempname = el.getAttribute("template-source");
								 if(!document.getElementById(subtempname)){
									 subtemplate_promises.push($.fetchAndAppendTemplate(subtempname));
								 }
							});
							Promise.all(subtemplate_promises).then(() => {
								resolve();
							});
						});
					}
				});
			},
			processElements:function(elements){
				for(const ele of elements){
					$.processChild(ele);
					if(ele.childElementCount > 0){
						$.processElements(ele.children);
					}
				}
			},
			processChild: function (element) {
				let attributes = element.attributes;
				for (const attr of attributes) {
					$.processAttribute(element, attr);
				}
			},
			processAttribute: function (element, attribute) {
				let ignoreNode = element.getAttribute("ignore") != undefined;
				switch (attribute.name) {
					case "if":
						if ($.data[attribute.value] != true) {
							while (element.firstChild) {
								element.removeChild(element.firstChild);
							}
						}else {
							$.processElements(element.children);
						}
						if(ignoreNode){
							while (element.children.length > 0)
							{
								element.insertAdjacentElement('beforeBegin', element.children[0]);
							}
							element.remove();
						}
						break;
					case "for-array":
						let arrayVal = $.findValueFromPath($.data,attribute.value) || [];
						element.removeAttribute(attribute.name);
						let as = element.getAttribute("as");
						element.removeAttribute("as");
						element.removeAttribute("ignore");
						$.currentContext.push(as);
						
						let newChildren = [];
						for (const eachArrayVal of arrayVal) {
							let clonedElement = element.cloneNode(true);
							clonedElement=clonedElement.children;
							$.data[as] = eachArrayVal;
							$.processElements(clonedElement);
							newChildren.push(clonedElement);
						}
						while (element.firstChild) {
							element.removeChild(element.firstChild);
						}
						for (const elg of newChildren) {
							while (elg.length > 0)
							{
								element.insertAdjacentElement(ignoreNode?'beforeBegin':'beforeEnd', elg[0]);
							}
						}
						if(ignoreNode){
							element.remove();
						}
						$.currentContext.pop();
						break;
					case "data-source":
						let valuePath = attribute.value;
						element.innerText = $.findValueFromPath($.data,valuePath);
						break;
					case "attr-if":
						attribute.value.split("]").forEach(function(eachExpression){
							eachExpression = eachExpression.trim().slice(1).trim();
							if(eachExpression != ""){
								eachExpression = eachExpression.split("=");
								let attributeToSet = eachExpression[0].trim();
								let tenary = eachExpression[1].split("?");
								let condition = tenary[0].trim().slice(1,-1).trim();
								let truefalse =  (tenary[1]||"").split(":").map(function(e){return e.trim();});
								let oldAttrVal = element.getAttribute(attributeToSet);
								let newAttrVal = [] ;
								if(oldAttrVal!=undefined){newAttrVal.push(oldAttrVal);}
								let expressionResult = $.processExpression(truefalse[$.processExpression[condition]?0:1]);
								if(expressionResult != undefined){
									newAttrVal.push(expressionResult);
									newAttrVal = newAttrVal.join(" ");
									element.setAttribute(attributeToSet,newAttrVal);
								}
							}
						});
						break;
					case "template-source":
							let templateSource = attribute.value;
							$.processTemplate(templateSource,undefined,element,true);
						break;
				}
				if(["if","for-array","data-source","attr-if","template-source"].indexOf(attribute.name) != -1 ){
					element.removeAttribute(attribute.name);
				}
				element.removeAttribute("ignore");
			},
			processExpression: function (expression) {
				if(expression == undefined){ return; }
				let expVal = expression.trim().slice(1,-1).trim();
				if(expression.charAt(0) == '{'){
					return $.expression[expVal]();
				}else if(expression.charAt(0) == "'"){
					return expVal;
				}else{
					return $.data[expVal]; 
				}
				
			},
			findValueFromPath: function(data,valuePath){
				valuePath = valuePath.split(".");
				for(let i=0;i<valuePath.length;i++){
					let path = valuePath[i];
					data = data[path];
				}
				return data;
			}
		}
		