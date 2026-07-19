#include <stdexcept>

class Renderer {
public:
    void render() {
        throw std::logic_error("not implemented");
    }

    void renderAlt() {
        throw std::logic_error("TODO: implement renderAlt");
    }
};
