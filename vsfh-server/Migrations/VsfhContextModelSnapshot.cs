﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using VerySimpleFileHost.Database;

#nullable disable

namespace VerySimpleFileHost.Migrations
{
    [DbContext(typeof(VsfhContext))]
    partial class VsfhContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder.HasAnnotation("ProductVersion", "6.0.0");

            modelBuilder.Entity("VerySimpleFileHost.Entities.User", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("TEXT");

                    b.Property<string>("FullName")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<byte[]>("InviteKey")
                        .HasColumnType("BLOB");

                    b.Property<bool>("IsAdministrator")
                        .HasColumnType("INTEGER");

                    b.Property<DateTime>("LastPasswordChangeUtc")
                        .HasColumnType("TEXT");

                    b.Property<string>("LoginName")
                        .HasColumnType("TEXT");

                    b.Property<string>("PasswordSaltedHash")
                        .HasColumnType("TEXT");

                    b.Property<DateTime>("RejectCookiesOlderThanUtc")
                        .HasColumnType("TEXT");

                    b.HasKey("Id");

                    b.HasIndex("LoginName")
                        .IsUnique();

                    b.ToTable("Users");
                });
#pragma warning restore 612, 618
        }
    }
}
