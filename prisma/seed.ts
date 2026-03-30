import { runCoreSeed } from "./seed/core.seed";
import { runDemoSeed } from "./seed/demo.seed";

async function main() {
  await runCoreSeed();
  await runDemoSeed();
}

main()
  .then(() => {
    console.log("KAIKO seed completed.");
  })
  .catch((error) => {
    console.error("KAIKO seed failed.", error);
    process.exitCode = 1;
  });
