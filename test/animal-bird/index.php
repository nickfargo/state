<?php
require '../../build/combine.php';
?>

<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
		<title>State.js Test Suite</title>
		<link rel="stylesheet" media="screen" href="../qunit.css" />
		
		<!-- libs -->
		<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.js"></script>
		
		<!-- includes -->
		<script src="../../state.js"></script>
		
		<!-- tests -->
		<script src="../qunit.js"></script>
		<script src="Animal.Bird.test.js"></script>
	</head>
	<body>
		<h1 id="qunit-header">State.js Test Suite</h1>
		<h2 id="qunit-banner"></h2>
		<div id="qunit-testrunner-toolbar"></div>
		<h2 id="qunit-userAgent"></h2>
		<ol id="qunit-tests"></ol>
		<div id="qunit-fixture">test markup, will be hidden</div>
	</body>
</html>
