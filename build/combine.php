<?php

$outputPath = './../state.js';
include 'files.php';

function file_append( $target, $source ) {
	$content = file_get_contents( $source );
	return file_put_contents( $target, "\n". $content . "\n", FILE_APPEND );
}



file_put_contents( $outputPath, file_get_contents( './../src/pre.js' ) );
foreach( $files as $file ) {
	file_append( $outputPath, './../src/' . $file . '.js' );
}
file_append( $outputPath, './../src/post.js' );
