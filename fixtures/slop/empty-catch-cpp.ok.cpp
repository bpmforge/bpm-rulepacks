#include <fstream>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>

class ConfigLoader {
public:
    std::string load(const std::string& path) {
        try {
            std::ifstream in(path);
            std::ostringstream buf;
            buf << in.rdbuf();
            return buf.str();
        } catch (const std::exception& e) {
            std::cerr << "failed to load config " << path << ": " << e.what() << std::endl;
            throw;
        }
    }

    std::string loadCatchAll(const std::string& path) {
        try {
            std::ifstream in(path);
            std::ostringstream buf;
            buf << in.rdbuf();
            return buf.str();
        } catch (...) {
            std::cerr << "unknown error loading " << path << std::endl;
            throw;
        }
    }
};
