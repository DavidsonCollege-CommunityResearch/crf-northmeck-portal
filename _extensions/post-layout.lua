-- Wraps a blog post's body in the site's post layout. The header comes from
-- _partials/post-title-block.html, which opens <div class="page"> and
-- <article class="post">; this closes them after the body.
function Pandoc(doc)
  table.insert(doc.blocks, 1, pandoc.RawBlock("html", '<div class="wrap"><div class="post-body">'))
  table.insert(doc.blocks, pandoc.RawBlock("html", table.concat({
    '</div></div>',
    '<div class="wrap"><div class="post-foot"><span class="post-back" onclick="window.location=\'/blog.html\'"><i class="ti ti-arrow-narrow-left"></i> All stories</span></div></div>',
    '</article>',
    '</div>'
  }, "\n")))
  return doc
end
