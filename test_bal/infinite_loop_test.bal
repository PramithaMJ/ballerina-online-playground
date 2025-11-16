import ballerina/io;

public function main() {
    int[] items = [1, 2, 3];

    // This will run the foreach over `items` forever
    while true {
        foreach int x in items {
            io:println("item = ", x);
        }
    }
}
