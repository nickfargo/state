<?php

$outputPath = './../state.js';
include 'files.php';

function file_append( $target, $source ) {
	$content = file_get_contents( $source );
	return file_put_contents( $target, "\n". $content . "\n", FILE_APPEND );
}



file_put_contents( $outputPath, file_get_contents( './../lib/__pre.js' ) );
foreach( $files as $file ) {
	file_append( $outputPath, './../lib/' . $file . '.js' );
}
file_append( $outputPath, './../lib/__post.js' );
