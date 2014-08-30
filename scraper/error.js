function blowUp(err) {
  console.log('******** BLOWING UP ********');
  console.log(JSON.stringify(err, null, 2));
  console.error(JSON.stringify(err, null, 2));
  console.log('******** BLOWING UP ********');
  phantom.exit();
}
