import ballerina/io;
import ballerina/lang.runtime as runtime;

public function main() {
    int maxIterations = 10000000; 
    // very high, but finite
    int count = 0;

    while count < maxIterations {
        count += 1;
        if count % 1000000 == 0 {
            io:println("Reached iteration: ", count);
            runtime:sleep(1); // yield so strand can be cancelled
        }
    }

    io:println("Finished safe stress loop");
}
