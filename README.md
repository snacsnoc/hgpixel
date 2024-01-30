# hgpixel - Homegrown Web Pixel

Internet privacy got you down? Tired of using AdBlockers in your browser to stop pesky advertisers track your internet history? 

Write your own super-duper web tracking pixel today! Simply embed the pixel script on any website you own, and voila! You can start harvesting precious user data instantly! No data privacy requirements needed!
GDPR? Never heard of her!
## Requirements
* Python 3.9+
* A smile on your face

## Setup
Install the pixel embed code from `pixeljs/embed.html` into your website.

Run the flask server:
`flask run`


Architecture Diagram:
```mermaid
graph LR
    client[Client] -- HTTP/HTTPS Requests --> lb[Load Balancer]

    lb -- Distributes Requests --> ws1[Web Server 1]
    lb -- Distributes Requests --> ws2[Web Server 2]
    lb -- Distributes Requests --> wsN[Web Server N]
    
    ws1 -- Flask App --> as1[App Server 1]
    ws2 -- Flask App --> as2[App Server 2]
    wsN -- Flask App --> asN[App Server N]
    
    as1 -- Insert Data --> mq[Message Queue]
    as2 -- Insert Data --> mq
    asN -- Insert Data --> mq
    
    mq -- Data for Processing --> worker1[Worker Process 1]
    mq -- Data for Processing --> worker2[Worker Process 2]
    mq -- Data for Processing --> workerN[Worker Process N]

    worker1 -- Processed Data --> db[(Database)]
    worker2 -- Processed Data --> db
    workerN -- Processed Data --> db

    db -- Query Responses --> cache[Cache Redis/Memcached]

    cache -.-> as1
    cache -.-> as2
    cache -.-> asN

    monitoring[Monitoring Prometheus/Grafana] -. Monitor .-> ws1
    monitoring -. Monitor .-> ws2
    monitoring -. Monitor .-> wsN
    monitoring -. Monitor .-> mq
    monitoring -. Monitor .-> db
    monitoring -. Monitor .-> cache
```