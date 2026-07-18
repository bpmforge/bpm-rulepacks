package accounts

import (
	"database/sql"
	"net/http"
)

func LookupHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	accountID := r.URL.Query().Get("accountId")
	rows, err := db.Query("SELECT balance FROM accounts WHERE id = ?", accountID)
	if err != nil {
		http.Error(w, "lookup failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
}
