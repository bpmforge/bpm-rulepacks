#include <stdexcept>
#include <vector>

class Shape {
public:
    void draw();
};

class Canvas {
public:
    void flush();
};

class Renderer {
public:
    void render() {
        for (auto& shape : shapes_) {
            shape.draw();
        }
    }

    void renderAlt() {
        if (shapes_.empty()) {
            throw std::logic_error("renderAlt called with no shapes registered");
        }
        canvas_.flush();
    }

private:
    std::vector<Shape> shapes_;
    Canvas canvas_;
};
