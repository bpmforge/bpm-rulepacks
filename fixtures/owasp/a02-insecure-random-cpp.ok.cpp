#include <cstdlib>
#include <ctime>

/* Picks a random enemy-spawn slot in a game level. */
int spawn_slot;

void pick_spawn_slot() {
    std::srand((unsigned int)std::time(nullptr));
    spawn_slot = rand();
}
