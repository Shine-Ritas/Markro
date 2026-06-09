/** Print the receipt marked with [data-pos-receipt-print] in the current page. */
export function printPosReceipt() {
  const cleanup = () => {
    document.body.classList.remove("printing-receipt");
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup, { once: true });
  document.body.classList.add("printing-receipt");
  window.print();
}
