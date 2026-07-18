package pages

import (
	"net/http"
	"text/template"
)

// GreetHandler renders the visitor's name straight into an HTML page with
// text/template, which does not HTML-escape its output.
func GreetHandler(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	tpl := template.Must(template.New("greet").Parse("<p>Hello, {{.}}</p>"))
	tpl.Execute(w, name)
}
