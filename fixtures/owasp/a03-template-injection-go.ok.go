package pages

import (
	"html/template"
	"net/http"
)

// GreetHandler renders the visitor's name into an HTML page with
// html/template, which context-aware escapes its output.
func GreetHandler(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	tpl := template.Must(template.New("greet").Parse("<p>Hello, {{.}}</p>"))
	tpl.Execute(w, name)
}
