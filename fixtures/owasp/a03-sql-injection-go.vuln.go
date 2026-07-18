package accounts

import (
	"database/sql"
	"fmt"
	"net/http"
)

func LookupHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	accountID := r.URL.Query().Get("accountId")
	query := fmt.Sprintf("SELECT balance FROM accounts WHERE id = %s", accountID)
	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, "lookup failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
}
