package accounts

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
)

func LookupHandler(c echo.Context, db *sql.DB) error {
	accountID := c.QueryParam("accountId")
	query := fmt.Sprintf("SELECT balance FROM accounts WHERE id = %s", accountID)
	rows, err := db.Query(query)
	if err != nil {
		return c.String(http.StatusInternalServerError, "lookup failed")
	}
	defer rows.Close()
	return c.JSON(http.StatusOK, map[string]bool{"ok": true})
}
