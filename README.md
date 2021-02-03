# $aa$.js - A library to make performant templates



The framework uses html dom-fragment to generate dom nodes thus reducing the parsing time.
Easily usable with html attributes. Simpler syntax makes the framework organic. 


#Examples

json: (resp)
{"transactions":[{"tid":1,"transactioncategory":"payment"},{"tid":2,"transactioncategory":"income"}]}

template: (transaction.html)
  <div for-array="transactions" as="transaction" ignore>
  	<span class="fl pL10" data-source="transaction.transactioncategory"></span>
  </div>

usage:
$aa$.tmpl("transaction.html",resp).then(function(tmplData){
    // append tmplData to dom
});

output:
  <span class="fl pL10" >payment</span>
  <span class="fl pL10" >income</span>
