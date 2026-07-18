import android.app.PendingIntent
import android.content.Context
import android.content.Intent

fun buildPendingIntent(ctx: Context, intent: Intent): PendingIntent {
    return PendingIntent.getActivity(
        ctx, 0, intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
}
