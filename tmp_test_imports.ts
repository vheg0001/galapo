import { cn } from "./lib/utils";
import { Badge } from "./components/ui/badge";

try {
    console.log("Testing cn:", cn("test"));
    console.log("Testing Badge:", Badge);
} catch (e) {
    console.error("Error:", e);
}
