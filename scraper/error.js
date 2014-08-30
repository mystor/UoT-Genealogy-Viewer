function blowUp(err) {
  console.log('******** BLOWING UP ********');
  console.log(err);
  console.error(err);
  console.log('******** BLOWING UP ********');
  phantom.exit();
}
