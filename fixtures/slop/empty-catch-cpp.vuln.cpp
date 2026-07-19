#include <fstream>
#include <sstream>
#include <stdexcept>
#include <string>

class ConfigLoader {
public:
    std::string load(const std::string& path) {
        std::string data;
        try {
            std::ifstream in(path);
            std::ostringstream buf;
            buf << in.rdbuf();
            data = buf.str();
        } catch (...) {
        }
        return data;
    }

    std::string loadTyped(const std::string& path) {
        std::string data;
        try {
            std::ifstream in(path);
            std::ostringstream buf;
            buf << in.rdbuf();
            data = buf.str();
        } catch (const std::exception& e) {
        }
        return data;
    }
};
