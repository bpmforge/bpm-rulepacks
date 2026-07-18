#include <cstdio>

/* Logs the first CLI argument (a job-name label) straight to the app's
 * diagnostic log stream. */
void log_job_name(char *argv[]) {
    char *job_name = argv[1];
    fprintf(stderr, job_name);
}
