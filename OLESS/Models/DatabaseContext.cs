using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace OLESS.Models
{
    public class DatabaseContext
    {
        private readonly string connectionString;

        public DatabaseContext(IConfiguration configuration)
        {
            connectionString = configuration.GetConnectionString("OLESSConnection");
        }

        public SqlConnection GetConnection()
        {
            return new SqlConnection(connectionString);
        }

        public int ExecuteNonQuery(string procedureName, SqlParameter[] parameters = null)
        {
            using (var connection = GetConnection())
            {
                using (var command = new SqlCommand(procedureName, connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    if (parameters != null)
                        command.Parameters.AddRange(parameters);
                    connection.Open();
                    return command.ExecuteNonQuery();
                }
            }
        }

        public object ExecuteScalar(string procedureName, SqlParameter[] parameters = null)
        {
            using (var connection = GetConnection())
            {
                using (var command = new SqlCommand(procedureName, connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    if (parameters != null)
                        command.Parameters.AddRange(parameters);
                    connection.Open();
                    return command.ExecuteScalar();
                }
            }
        }

        public DataTable ExecuteReader(string procedureName, SqlParameter[] parameters = null)
        {
            var dataTable = new DataTable();
            using (var connection = GetConnection())
            {
                using (var command = new SqlCommand(procedureName, connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    if (parameters != null)
                        command.Parameters.AddRange(parameters);
                    connection.Open();
                    using (var adapter = new SqlDataAdapter(command))
                    {
                        adapter.Fill(dataTable);
                    }
                }
            }
            return dataTable;
        }

        public SqlDataReader ExecuteReaderAsync(string procedureName, SqlParameter[] parameters = null)
        {
            var connection = GetConnection();
            var command = new SqlCommand(procedureName, connection)
            {
                CommandType = CommandType.StoredProcedure
            };
            if (parameters != null)
                command.Parameters.AddRange(parameters);
            connection.Open();
            return command.ExecuteReader(CommandBehavior.CloseConnection);
        }
    }
}
