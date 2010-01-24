#!/usr/bin/env ruby -wKU
require 'rubygems'
require 'eventmachine'
require 'evma_httpserver'

class Handler < EM::Connection
  include EM::HttpServer

  def process_http_request
    resp = EventMachine::DelegatedHttpResponse.new( self )
    $to_return << proc {
      resp.status = 200
      resp.content = "Finished"
      resp.send_response
    }
  end

end

$to_return = []

EventMachine::run do
  EventMachine.epoll
  timer = EM::PeriodicTimer.new(5) do
    $to_return.each do |p|
      p.call
    end
  end
  EventMachine::start_server("0.0.0.0", 8082, Handler)
  puts "Listening..."
end

