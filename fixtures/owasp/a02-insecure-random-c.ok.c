#include <stdlib.h>
#include <time.h>

/* Rolls a die for a non-security board-game simulation. */
int dice_roll;

void roll_die(void) {
    srand((unsigned int)time(NULL));
    dice_roll = rand();
}
