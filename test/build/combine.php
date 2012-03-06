<?php

$outputPath = './../test.js';
include 'files.php';

function file_append( $target, $source ) {
	$content = file_get_contents( $source );
	return file_put_contents( $target, "\n". $content . "\n", FILE_APPEND );
}



file_put_contents( $outputPath, file_get_contents( './../unit/__pre.test.js' ) );
foreach( $files as $file ) {
	file_append( $outputPath, './../unit/' . $file . '.test.js' );
}
file_append( $outputPath, './../unit/__post.test.js' );
