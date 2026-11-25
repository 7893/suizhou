# Inject the trail script into the HTML document. Precompressed HTML skips sub_filter.
gzip_static off;
sub_filter '</body>' '<script src="/sz/visit.js" defer></script></body>';
sub_filter_once on;
