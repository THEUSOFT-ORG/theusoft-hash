self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Detecta /validate/<hash>
  const match = url.pathname.match(/^\/validate\/([a-fA-F0-9]{64})$/);

  if (match) {
    const hash = match[1];

    event.respondWith(
      fetch('/index.html')
        .then(res => res.text())
        .then(html => {
          // Injeta script com alert
          const injected = html.replace(
            '</body>',
            `<script>alert("Hash recebido: ${hash}");</script></body>`
          );

          return new Response(injected, {
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
  }
});
