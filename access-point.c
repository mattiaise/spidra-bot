#include <WiFi.h>

// Replace with your network credentials
const char* ssid     = "ESP32-Access-Point";
const char* password = "123456789";

// Set web server port number to 80
WiFiServer server(80);

// Variable to store the HTTP request
String header;

// Auxiliar variables to store the current output state
String outputState = "off"; // State of the LED on GPIO 2

// Assign built-in LED variables
const int led2 = 2; // Built-in LED pin on ESP32

void setup() {
  Serial.begin(115200);
  // Initialize the output variable as an output
  pinMode(led2, OUTPUT);
  // Set output to LOW
  digitalWrite(led2, LOW);

  // Connect to Wi-Fi network with SSID and password
  Serial.print("Setting AP (Access Point)...");
  // Remove the password parameter, if you want the AP (Access Point) to be open
  WiFi.softAP(ssid, password);

  IPAddress IP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(IP);

  server.begin();
}

void loop() {
  WiFiClient client = server.available();   // Listen for incoming clients
  if (!client) continue;
  
  String currentLine = "";                // make a String to hold incoming data from the client
  while (client.connected() && client.available()) {            // if there's bytes to read from the client,
    char c = client.read();             // read a byte, then
    Serial.write(c);                    // print it out the serial monitor
    header += c;
    if (c == '\n') {                    
      if (currentLine.length() == 0) {

        File file = SPIFFS.open("/src/index.html", "r");
        if(!file) {Serial.println("Error")}        

        client.println("HTTP/1.1 200 OK");
        client.println("Content-type:text/html");
        client.println("Connection: close");
        client.println();

        while (file.available()) {
          client.print(file.readString());
        }
        
        // The HTTP response ends with another blank line
        client.println();
        // Break out of the while loop
        break;
      } else { // if you got a newline, then clear currentLine
        currentLine = "";
      }
    } else if (c != '\r') {  // if you got anything else but a carriage return character,
      currentLine += c;      // add it to the end of the currentLine
    }
    
  }
  // Clear the header variable
  header = "";
  // Close the connection
  client.stop();
  Serial.println("Client disconnected.");
  Serial.println("");
  
}
